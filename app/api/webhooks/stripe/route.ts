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

      if (error) {
        console.error('[webhook/stripe] checkout.session.completed DB error', error)
        return NextResponse.json({ error: 'Erro ao atualizar plano.' }, { status: 500 })
      }

      if (planType === 'max') {
        const initError = await initMaxWorkspace(supabase, workspaceId)
        if (initError) {
          console.error('[webhook/stripe] initMaxWorkspace error', initError)
          return NextResponse.json({ error: 'Erro ao inicializar plano MAX.' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ received: true })
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const { error } = await supabase
      .from('workspaces')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('[webhook/stripe] subscription.deleted DB error', error)
      return NextResponse.json({ error: 'Erro ao rebaixar plano.' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
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

      if (error) {
        console.error('[webhook/stripe] subscription.updated (inactive) DB error', error)
        return NextResponse.json({ error: 'Erro ao atualizar plano.' }, { status: 500 })
      }
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

      if (error) {
        console.error('[webhook/stripe] subscription.updated DB error', error)
        return NextResponse.json({ error: 'Erro ao atualizar plano.' }, { status: 500 })
      }

      if (isMax && updated) {
        const initError = await initMaxWorkspace(supabase, updated.id)
        if (initError) {
          console.error('[webhook/stripe] initMaxWorkspace error', initError)
          return NextResponse.json({ error: 'Erro ao inicializar plano MAX.' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}

// Inicializa workspace recém-promovido ao plano MAX:
// cria empresa padrão e promove admins a 'master'.
// Retorna um erro se algo falhar, null se OK.
async function initMaxWorkspace(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  workspaceId: string
): Promise<Error | null> {
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
        const { error } = await supabase.from('companies').insert({
          workspace_id: workspaceId,
          name: ws.name,
        })
        if (error) return error
      }
    }

    // Promove todos os admins a 'master'
    const { error } = await supabase
      .from('workspace_members')
      .update({ sales_role: 'master' })
      .eq('workspace_id', workspaceId)
      .eq('role', 'admin')

    if (error) return error

    return null
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err))
  }
}
