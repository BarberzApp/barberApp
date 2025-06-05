-- Create function to get table definitions
CREATE OR REPLACE FUNCTION pg_temp.pg_get_tabledef(
    schema_name text,
    table_name text,
    include_owner boolean DEFAULT false,
    include_privileges boolean DEFAULT false,
    include_constraints boolean DEFAULT true
) RETURNS text AS $$
DECLARE
    v_table_def text;
    v_owner text;
    v_privileges text;
    v_constraints text;
BEGIN
    -- Get table definition
    SELECT pg_get_tabledef(table_name, schema_name) INTO v_table_def;
    
    -- Get owner if requested
    IF include_owner THEN
        SELECT 'ALTER TABLE ' || quote_ident(schema_name) || '.' || quote_ident(table_name) || 
               ' OWNER TO ' || quote_ident(owner) || ';'
        INTO v_owner
        FROM pg_tables
        WHERE schemaname = schema_name AND tablename = table_name;
    END IF;
    
    -- Get privileges if requested
    IF include_privileges THEN
        SELECT string_agg(
            'GRANT ' || privilege_type || ' ON ' || quote_ident(schema_name) || '.' || 
            quote_ident(table_name) || ' TO ' || quote_ident(grantee) || ';',
            E'\n'
        )
        INTO v_privileges
        FROM information_schema.role_table_grants
        WHERE table_schema = schema_name AND table_name = table_name;
    END IF;
    
    -- Get constraints if requested
    IF include_constraints THEN
        SELECT string_agg(
            'ALTER TABLE ' || quote_ident(schema_name) || '.' || quote_ident(table_name) || 
            ' ADD CONSTRAINT ' || quote_ident(conname) || ' ' || pg_get_constraintdef(oid) || ';',
            E'\n'
        )
        INTO v_constraints
        FROM pg_constraint
        WHERE conrelid = (schema_name || '.' || table_name)::regclass;
    END IF;
    
    -- Combine all parts
    RETURN v_table_def || 
           CASE WHEN include_owner AND v_owner IS NOT NULL THEN E'\n' || v_owner ELSE '' END ||
           CASE WHEN include_privileges AND v_privileges IS NOT NULL THEN E'\n' || v_privileges ELSE '' END ||
           CASE WHEN include_constraints AND v_constraints IS NOT NULL THEN E'\n' || v_constraints ELSE '' END;
END;
$$ LANGUAGE plpgsql;

-- Get definitions for our tables
SELECT pg_temp.pg_get_tabledef('public', 'profiles', true, true, true) as profiles_def;
SELECT pg_temp.pg_get_tabledef('public', 'barbers', true, true, true) as barbers_def;
SELECT pg_temp.pg_get_tabledef('public', 'services', true, true, true) as services_def;
SELECT pg_temp.pg_get_tabledef('public', 'bookings', true, true, true) as bookings_def;
SELECT pg_temp.pg_get_tabledef('public', 'availability', true, true, true) as availability_def;
SELECT pg_temp.pg_get_tabledef('public', 'notifications', true, true, true) as notifications_def; 