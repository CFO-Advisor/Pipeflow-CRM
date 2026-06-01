import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook/stripe] Invalid signature', err)
    return NextResponse.json({ error: 'Webhook inválido.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const workspaceId = session.metadata?.workspace_id
    const planType = (session.metadata?.plan_type ?? 'pro') as 'pro' | 'max'

    if (workspaceId && session.subscription) {
      const newPlan = planType === 'max' ? 'max' : 'pro'

      const { error } = await supabase
        .from('workspaces')
        .update({ plan: newPlan, stripe_subscription_id: session.subscription as string })
        .eq('id', workspaceId)

      if (error) console.error('[webhook/stripe] checkout.session.completed DB error', error)

      if (planType === 'max') {
        await initMaxWorkspace(supabase, workspaceId)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const { error } = await supabase
      .from('workspaces')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', subscription.id)

    if (error) console.error('[webhook/stripe] subscription.deleted DB error', error)
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const status = subscription.status
    const isActive = status === 'active' || status === 'trialing'

    if (!isActive) {
      const { error } = await supabase
        .from('workspaces')
        .update({ plan: 'free' })
        .eq('stripe_subscription_id', subscription.id)

      if (error) console.error('[webhook/stripe] subscription.updated (inactive) DB error', error)
    } else {
      const priceId = subscription.items.data[0]?.price.id
      const isMax = priceId === process.env.STRIPE_PRICE_ID_MAX
      const newPlan = isMax ? 'max' : 'pro'

      const { data: updated, error } = await supabase
        .from('workspaces')
        .update({ plan: newPlan })
        .eq('stripe_subscription_id', subscription.id)
        .select('id')
        .single()

      if (error) console.error('[webhook/stripe] subscription.updated DB error', error)

      if (isMax && updated) {
        await initMaxWorkspace(supabase, updated.id)
      }
    }
  }

  return NextResponse.json({ received: true })
}

// Inicializa workspace recém-promovido ao plano MAX:
// cria empresa padrão e promove admins a 'master'
async function initMaxWorkspace(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  workspaceId: string
) {
  try {
    // Cria empresa padrão se ainda não existe nenhuma
    const { count } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    if ((count ?? 0) === 0) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single()

      if (ws) {
        await supabase.from('companies').insert({
          workspace_id: workspaceId,
          name: ws.name,
        })
      }
    }

    // Promove todos os admins a 'master'
    await supabase
      .from('workspace_members')
      .update({ sales_role: 'master' })
      .eq('workspace_id', workspaceId)
      .eq('role', 'admin')
  } catch (err) {
    console.error('[webhook/stripe] initMaxWorkspace error', err)
  }
}
