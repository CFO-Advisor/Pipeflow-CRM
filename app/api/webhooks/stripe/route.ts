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

    if (workspaceId && session.subscription) {
      const { error } = await supabase
        .from('workspaces')
        .update({
          plan: 'pro',
          stripe_subscription_id: session.subscription as string,
        })
        .eq('id', workspaceId)

      if (error) console.error('[webhook/stripe] checkout.session.completed DB error', error)
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
    const { error } = await supabase
      .from('workspaces')
      .update({ plan: isActive ? 'pro' : 'free' })
      .eq('stripe_subscription_id', subscription.id)

    if (error) console.error('[webhook/stripe] subscription.updated DB error', error)
  }

  return NextResponse.json({ received: true })
}
