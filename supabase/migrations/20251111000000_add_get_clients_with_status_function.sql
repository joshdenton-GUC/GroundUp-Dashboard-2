-- Create a function to get clients with their profile information
-- This bypasses PostgREST's foreign key validation issues
CREATE OR REPLACE FUNCTION get_clients_with_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Query to join clients with profiles and return as JSON
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'user_id', c.user_id,
      'company_name', c.company_name,
      'contact_phone', c.contact_phone,
      'address', c.address,
      'street1', c.street1,
      'street2', c.street2,
      'city', c.city,
      'state', c.state,
      'zip', c.zip,
      'welcome_email_sent', c.welcome_email_sent,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'invitation_status', 'confirmed',
      'email_confirmed_at', NULL,
      'profiles', json_build_object(
        'user_id', p.user_id,
        'email', p.email,
        'full_name', p.full_name,
        'role', p.role,
        'is_active', p.is_active
      )
    )
  ) INTO result
  FROM clients c
  INNER JOIN profiles p ON c.user_id = p.user_id
  WHERE p.role = 'client'
  ORDER BY c.created_at DESC;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_clients_with_status() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_clients_with_status() IS 'Returns all clients with their profile information. Used by admin dashboard to bypass PostgREST foreign key validation issues.';
