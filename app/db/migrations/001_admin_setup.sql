-- ============================================
-- Neon PostgreSQL Migration Script
-- For: Micro-Personal-Smart-Finance
-- ============================================

-- 1. Add 'role' column to user table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'role') THEN
        ALTER TABLE "user" ADD COLUMN role TEXT DEFAULT 'user';
        COMMENT ON COLUMN "user".role IS 'user, admin, superadmin';
    END IF;
END $$;

-- 2. Add 'is_active' column to user table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'is_active') THEN
        ALTER TABLE "user" ADD COLUMN is_active BOOLEAN DEFAULT true;
        COMMENT ON COLUMN "user".is_active IS 'for admin to disable/enable users';
    END IF;
END $$;

-- 3. Create or update superadmin user
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM "user" WHERE email = 'k.net.game03@gmail.com';
    
    IF user_id IS NULL THEN
        INSERT INTO "user" (id, email, name, role, is_active, email_verified)
        VALUES (
            gen_random_uuid(),
            'k.net.game03@gmail.com',
            'Super Admin',
            'superadmin',
            true,
            NOW()
        );
        RAISE NOTICE 'Created superadmin user';
    ELSE
        UPDATE "user" 
        SET role = 'superadmin', is_active = true
        WHERE id = user_id;
        RAISE NOTICE 'Updated to superadmin';
    END IF;
END $$;

-- Verify
SELECT id, email, name, role, is_active FROM "user" WHERE email = 'k.net.game03@gmail.com';
