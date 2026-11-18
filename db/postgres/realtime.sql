-- =====================================================================
--  Oota — live change notifications (so terminal edits show up in the UI)
--  1. A row-level trigger on every app table calls pg_notify('oota_changes', ...)
--     on INSERT / UPDATE / DELETE / TRUNCATE.
--  2. An EVENT TRIGGER notifies on DDL (DROP TABLE, ALTER TABLE, CREATE ...).
--  The backend LISTENs on 'oota_changes' and pushes each event to the browser
--  over Server-Sent Events. Re-runnable.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_notify_change() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('oota_changes', json_build_object(
        'source', 'postgres', 'table', TG_TABLE_NAME, 'op', TG_OP)::text);
    RETURN NULL;
END $$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','admins','cuisines','restaurants','restaurant_owners','restaurant_cuisines',
                             'menu_categories','dishes','favourite_restaurants','orders','order_items']
    LOOP
        IF to_regclass(t) IS NOT NULL THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_notify_%1$s ON %1$I', t);
            EXECUTE format('CREATE TRIGGER trg_notify_%1$s AFTER INSERT OR UPDATE OR DELETE ON %1$I
                            FOR EACH STATEMENT EXECUTE FUNCTION fn_notify_change()', t);
            EXECUTE format('DROP TRIGGER IF EXISTS trg_notify_trunc_%1$s ON %1$I', t);
            EXECUTE format('CREATE TRIGGER trg_notify_trunc_%1$s AFTER TRUNCATE ON %1$I
                            FOR EACH STATEMENT EXECUTE FUNCTION fn_notify_change()', t);
        END IF;
    END LOOP;
END $$;

-- DDL: fires after DROP TABLE / ALTER TABLE / CREATE TABLE etc.
CREATE OR REPLACE FUNCTION fn_notify_ddl() RETURNS event_trigger AS $$
DECLARE obj RECORD; tag TEXT := tg_tag;
BEGIN
    IF tg_event = 'sql_drop' THEN
        FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects() WHERE object_type = 'table' LOOP
            PERFORM pg_notify('oota_changes', json_build_object(
                'source', 'postgres', 'table', obj.object_name, 'op', tag)::text);
        END LOOP;
    ELSE
        FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
            PERFORM pg_notify('oota_changes', json_build_object(
                'source', 'postgres', 'table', split_part(obj.object_identity, '.', 2), 'op', tag)::text);
        END LOOP;
    END IF;
END $$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS evt_notify_drop;
DROP EVENT TRIGGER IF EXISTS evt_notify_ddl;
CREATE EVENT TRIGGER evt_notify_drop ON sql_drop EXECUTE FUNCTION fn_notify_ddl();
CREATE EVENT TRIGGER evt_notify_ddl  ON ddl_command_end
    WHEN TAG IN ('CREATE TABLE', 'ALTER TABLE') EXECUTE FUNCTION fn_notify_ddl();
