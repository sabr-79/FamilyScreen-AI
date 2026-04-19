# Stripe Integration for FamilyScreen AI Premium Subscriptions
import os
import stripe
from fastapi import HTTPException
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

def get_stripe():
    """Set API key at call time so .env is always loaded first"""
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="STRIPE_SECRET_KEY not configured")
    stripe.api_key = key
    return stripe

class StripeService:
    """Handle Stripe subscription operations"""

    @staticmethod
    async def create_checkout_session(user_email: str, user_id: str, success_url: str, cancel_url: str) -> dict:
        """Create a Stripe Checkout session for subscription"""
        s = get_stripe()
        price_id = os.getenv("STRIPE_PRICE_ID")
        if not price_id:
            raise HTTPException(status_code=500, detail="STRIPE_PRICE_ID not configured")

        try:
            session = s.checkout.Session.create(
                customer_email=user_email,
                client_reference_id=user_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                subscription_data={
                    'trial_period_days': 7,
                    'metadata': {'user_id': user_id}
                },
                metadata={'user_id': user_id}
            )
            return {
                "checkout_url": session.url,
                "session_id": session.id
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def create_customer_portal_session(customer_id: str, return_url: str) -> dict:
        """Create a customer portal session for managing subscription"""
        s = get_stripe()
        try:
            session = s.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return {"portal_url": session.url}
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def get_subscription_status(customer_id: str) -> dict:
        """Get subscription status for a customer"""
        s = get_stripe()
        try:
            subscriptions = s.Subscription.list(
                customer=customer_id,
                status='all',
                limit=1
            )
            if not subscriptions.data:
                return {"status": "inactive", "is_premium": False}

            subscription = subscriptions.data[0]
            return {
                "status": subscription.status,
                "is_premium": subscription.status in ['active', 'trialing'],
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "trial_end": subscription.trial_end if subscription.status == 'trialing' else None
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def cancel_subscription(subscription_id: str) -> dict:
        """Cancel a subscription at period end"""
        s = get_stripe()
        try:
            subscription = s.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return {
                "status": "canceled",
                "cancel_at": subscription.current_period_end
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def verify_webhook_signature(payload: bytes, sig_header: str) -> dict:
        """Verify Stripe webhook signature"""
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            return event
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
