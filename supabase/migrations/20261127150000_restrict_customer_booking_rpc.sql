-- Restrict customer booking creation to signed-in customers.
-- The function also checks auth.uid() internally, but PUBLIC's default EXECUTE
-- privilege should not leave the RPC callable by the anon role.
REVOKE ALL PRIVILEGES
ON FUNCTION public.create_customer_booking(jsonb)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.create_customer_booking(jsonb)
TO authenticated;
