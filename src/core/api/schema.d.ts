/**
 * GENERATED FILE: do not edit by hand.
 * Source: backend OpenAPI schema. Regenerate with `npm run gen:api`.
 */

export interface paths {
    "/healthz": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Liveness probe */
        get: operations["healthz_healthz_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/readyz": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Readiness probe */
        get: operations["readyz_readyz_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Public sign-in configuration */
        get: operations["auth_config_v1_auth_config_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Register */
        post: operations["register_v1_auth_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login */
        post: operations["login_v1_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/login/totp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Finish signing in with a code (two-step sign-in) */
        post: operations["login_totp_v1_auth_login_totp_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Refresh */
        post: operations["refresh_v1_auth_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Logout */
        post: operations["logout_v1_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/logout-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Logout All */
        post: operations["logout_all_v1_auth_logout_all_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/password/change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Change Password */
        post: operations["change_password_v1_auth_password_change_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Google Sign In */
        post: operations["google_sign_in_v1_auth_google_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/totp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Whether two-step sign-in is on */
        get: operations["read_two_factor_v1_auth_totp_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/totp/setup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** A new secret to add to an authenticator app */
        post: operations["setup_two_factor_v1_auth_totp_setup_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/totp/enable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Turn it on (password and a code from the app); returns the recovery codes once */
        post: operations["enable_two_factor_v1_auth_totp_enable_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/totp/disable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Turn it off (password and a code) */
        post: operations["disable_two_factor_v1_auth_totp_disable_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/totp/recovery-codes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** New recovery codes in place of the old ones (a code as proof) */
        post: operations["renew_recovery_codes_v1_auth_totp_recovery_codes_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My profile */
        get: operations["read_me_v1_me_get"];
        put?: never;
        post?: never;
        /** Delete my account and everything in it, for good */
        delete: operations["delete_me_v1_me_delete"];
        options?: never;
        head?: never;
        /** Update my profile */
        patch: operations["update_me_v1_me_patch"];
        trace?: never;
    };
    "/v1/me/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** All my data, as one JSON file */
        get: operations["export_my_data_v1_me_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Signed-in devices */
        get: operations["list_sessions_v1_me_sessions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me/sessions/{session_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Sign out one device */
        delete: operations["revoke_session_v1_me_sessions__session_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/modules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Modules for the Welcome page */
        get: operations["list_modules_v1_modules_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/modules/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Arrange my modules */
        put: operations["reorder_modules_v1_modules_order_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/modules/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** One module */
        get: operations["read_module_v1_modules__key__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/modules/{key}/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Pin, unpin, turn on or off for me */
        patch: operations["update_preferences_v1_modules__key__preferences_patch"];
        trace?: never;
    };
    "/v1/modules/{key}/interest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Notify me when this module launches */
        post: operations["request_launch_notice_v1_modules__key__interest_post"];
        /** Stop the launch notice */
        delete: operations["cancel_launch_notice_v1_modules__key__interest_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/modules/{key}/settings/schema": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** JSON Schema of the module's settings */
        get: operations["read_settings_schema_v1_modules__key__settings_schema_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/modules/{key}/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My settings for a module */
        get: operations["read_settings_v1_modules__key__settings_get"];
        /** Save my settings for a module */
        put: operations["save_settings_v1_modules__key__settings_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/agents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Agents, and whether AI can run for me */
        get: operations["list_agents_v1_agents_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/agents/{name}/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Ask an agent */
        post: operations["run_agent_v1_agents__name__runs_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/agents/{name}/photo-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Ask an agent's skill to read a photo (a receipt)
         * @description For a skill that reads photos (its metadata `reads`). The photo is held in memory for the run and sent only to providers that read images; it is never stored. Without AI the run falls to the skill's static script, which reads text only: the app then reads the photo on the device and sends that text instead.
         */
        post: operations["run_agent_on_photo_v1_agents__name__photo_runs_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/agents/runs/{run_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** One of my runs */
        get: operations["read_run_v1_agents_runs__run_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/agents/proposals/{proposal_id}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Confirm a proposed change (runs it) */
        post: operations["confirm_proposal_v1_agents_proposals__proposal_id__confirm_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/agents/proposals/{proposal_id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reject a proposed change */
        post: operations["reject_proposal_v1_agents_proposals__proposal_id__reject_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My dashboard */
        get: operations["read_dashboard_v1_dashboard_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My recent activity */
        get: operations["list_activity_v1_activity_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My notifications, newest first */
        get: operations["list_notifications_v1_notifications_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark everything as read */
        post: operations["read_all_v1_notifications_read_all_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/{notification_id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark one as read */
        post: operations["read_one_v1_notifications__notification_id__read_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/{notification_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove one */
        delete: operations["remove_one_v1_notifications__notification_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reminders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My open reminders, soonest due first */
        get: operations["list_reminders_v1_reminders_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reminders/{reminder_id}/snooze": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Remind me again in a few days */
        post: operations["snooze_v1_reminders__reminder_id__snooze_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reminders/{reminder_id}/dismiss": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Stop reminding me */
        post: operations["dismiss_v1_reminders__reminder_id__dismiss_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/push": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Whether pushes can be sent, and to how many of my browsers */
        get: operations["read_push_v1_push_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/push/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Receive pushes in this browser */
        post: operations["subscribe_v1_push_subscriptions_post"];
        /** Stop pushes to this browser */
        delete: operations["unsubscribe_v1_push_subscriptions_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/push/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Send myself a test push */
        post: operations["send_test_v1_push_test_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Find my own things in every module I use */
        get: operations["search_everything_v1_search_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/fx/rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What one unit of a currency buys of the others (default: my base currency) */
        get: operations["read_rates_v1_fx_rates_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dashboard across all users */
        get: operations["read_all_users_dashboard_v1_admin_dashboard_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/audit-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The audit trail, newest first: who changed what, and on whose account */
        get: operations["list_audit_logs_v1_admin_audit_logs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Accounts, newest first */
        get: operations["list_users_v1_admin_users_get"];
        put?: never;
        /** Create an account with a one-time password, returned once (audited) */
        post: operations["create_user_v1_admin_users_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/users/{user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** One account */
        get: operations["read_user_v1_admin_users__user_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Change an account's role, or disable or enable it (audited) */
        patch: operations["change_user_v1_admin_users__user_id__patch"];
        trace?: never;
    };
    "/v1/admin/users/{user_id}/revoke-sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Sign an account out everywhere (audited) */
        post: operations["revoke_user_sessions_v1_admin_users__user_id__revoke_sessions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/users/{user_id}/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reset an account's password to a one-time one, returned once; clears 2FA (audited) */
        post: operations["reset_user_password_v1_admin_users__user_id__reset_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/users/{user_id}/modules/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Give an account a module only some accounts may use, or take it back (audited) */
        put: operations["set_user_module_v1_admin_users__user_id__modules__key__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/allowed-emails": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Who may register: from the settings and from the console */
        get: operations["list_allowed_v1_admin_allowed_emails_get"];
        put?: never;
        /** Let an address register (audited) */
        post: operations["add_allowed_v1_admin_allowed_emails_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/allowed-emails/{email}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Stop letting an address register (audited; accounts made already stay) */
        delete: operations["remove_allowed_v1_admin_allowed_emails__email__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/modules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Every module, as its manifest says and as overridden */
        get: operations["list_modules_v1_admin_modules_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/modules/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Override a module's status, switch or order; null: the manifest's (audited) */
        patch: operations["change_module_v1_admin_modules__key__patch"];
        trace?: never;
    };
    "/v1/admin/analytics/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Sign-ups, active users, assistant answers and errors, by day */
        get: operations["read_usage_v1_admin_analytics_usage_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/analytics/db": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** How full the database is, and its collections' sizes */
        get: operations["read_db_v1_admin_analytics_db_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My entries (sort by date, amount_minor, created_at, title) */
        get: operations["list_entries_v1_expenses_entries_get"];
        put?: never;
        /** Add an entry (once per Idempotency-Key) */
        post: operations["add_entry_v1_expenses_entries_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Totals of my entries */
        get: operations["summarise_entries_v1_expenses_entries_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries/facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Tags, people and merchants I have used */
        get: operations["entry_facets_v1_expenses_entries_facets_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries/duplicates/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Saved entries that look like ones about to be saved (advice only) */
        post: operations["check_duplicates_v1_expenses_entries_duplicates_check_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries/bulk-update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** One change to many entries: category, a tag, delete or bring back */
        post: operations["bulk_update_v1_expenses_entries_bulk_update_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries/{entry_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** One entry (also when deleted) */
        get: operations["read_entry_v1_expenses_entries__entry_id__get"];
        /** Save an edited entry */
        put: operations["save_entry_v1_expenses_entries__entry_id__put"];
        post?: never;
        /** Delete an entry (it can be brought back) */
        delete: operations["delete_entry_v1_expenses_entries__entry_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries/{entry_id}/undelete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Bring a deleted entry back */
        post: operations["undelete_entry_v1_expenses_entries__entry_id__undelete_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries/{entry_id}/revisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** An entry's history, newest first */
        get: operations["entry_history_v1_expenses_entries__entry_id__revisions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/entries/{entry_id}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Put an entry back to an earlier revision */
        post: operations["restore_entry_v1_expenses_entries__entry_id__restore_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** System categories and my own */
        get: operations["list_categories_v1_expenses_categories_get"];
        put?: never;
        /** Add a category of my own */
        post: operations["add_category_v1_expenses_categories_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/categories/{category_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Archive one of my categories (its entries keep it) */
        delete: operations["archive_category_v1_expenses_categories__category_id__delete"];
        options?: never;
        head?: never;
        /** Rename or restyle one of my categories */
        patch: operations["change_category_v1_expenses_categories__category_id__patch"];
        trace?: never;
    };
    "/v1/expenses/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What I buy, with how its price is going (recently bought first) */
        get: operations["list_products_v1_expenses_products_get"];
        put?: never;
        /** Follow the price of what an entry is called */
        post: operations["track_product_v1_expenses_products_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/products/{product_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A product: every purchase, its price per unit, and where it's cheapest */
        get: operations["read_product_v1_expenses_products__product_id__get"];
        put?: never;
        post?: never;
        /** Stop following a product (its entries stay) */
        delete: operations["stop_product_v1_expenses_products__product_id__delete"];
        options?: never;
        head?: never;
        /** Rename a product, change its names, price unit or price alert */
        patch: operations["change_product_v1_expenses_products__product_id__patch"];
        trace?: never;
    };
    "/v1/expenses/products/{product_id}/merge": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Combine another product into this one (its names and entries join it) */
        post: operations["merge_product_v1_expenses_products__product_id__merge_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/products/{product_id}/apart": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Say two products are different things (no more suggestions to combine them) */
        post: operations["keep_apart_v1_expenses_products__product_id__apart_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Spent, received and kept, against the days before */
        get: operations["summary_v1_expenses_analytics_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/by-category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Totals by category (default: spending) */
        get: operations["by_category_v1_expenses_analytics_by_category_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/by-person": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Totals by who it was for (U6) */
        get: operations["by_person_v1_expenses_analytics_by_person_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/daily": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A total for every day */
        get: operations["daily_v1_expenses_analytics_daily_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/monthly": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Spent and received, month by month */
        get: operations["monthly_v1_expenses_analytics_monthly_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/net": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Net savings, month by month and in all (U1) */
        get: operations["net_v1_expenses_analytics_net_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/top-products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What was spent on each product */
        get: operations["top_products_v1_expenses_analytics_top_products_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/top-merchants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Where the money went */
        get: operations["top_merchants_v1_expenses_analytics_top_merchants_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/weekday-heatmap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Each day by week, and each weekday */
        get: operations["weekday_heatmap_v1_expenses_analytics_weekday_heatmap_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/cumulative": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The running total, against the days before */
        get: operations["cumulative_v1_expenses_analytics_cumulative_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/forecast": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Where this month's spending is heading */
        get: operations["forecast_v1_expenses_analytics_forecast_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/analytics/anomalies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Expenses far above the usual for their category */
        get: operations["anomalies_v1_expenses_analytics_anomalies_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/insights": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A week or month in figures, and a summary of them (kept while they don't change) */
        get: operations["read_insight_v1_expenses_insights_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/insights/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Write the summary again, even if the figures haven't changed */
        post: operations["refresh_insight_v1_expenses_insights_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/budgets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My budgets, each with how it stands today (newest first) */
        get: operations["list_budgets_v1_expenses_budgets_get"];
        put?: never;
        /** Add a budget for all spending, a category or a tag (a trip, an event) */
        post: operations["add_budget_v1_expenses_budgets_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/budgets/{budget_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a budget (its entries stay) */
        delete: operations["delete_budget_v1_expenses_budgets__budget_id__delete"];
        options?: never;
        head?: never;
        /** Change a budget (only what is sent) */
        patch: operations["change_budget_v1_expenses_budgets__budget_id__patch"];
        trace?: never;
    };
    "/v1/expenses/goals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My goals, each with how far it has come (newest first) */
        get: operations["list_goals_v1_expenses_goals_get"];
        put?: never;
        /** Add a goal, funded by hand or by net savings (once per Idempotency-Key) */
        post: operations["add_goal_v1_expenses_goals_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/goals/{goal_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a goal (it can be brought back) */
        delete: operations["delete_goal_v1_expenses_goals__goal_id__delete"];
        options?: never;
        head?: never;
        /** Change a goal (only what is sent), as of the revision edited */
        patch: operations["change_goal_v1_expenses_goals__goal_id__patch"];
        trace?: never;
    };
    "/v1/expenses/goals/{goal_id}/undelete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Bring a deleted goal back */
        post: operations["undelete_goal_v1_expenses_goals__goal_id__undelete_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/goals/{goal_id}/contributions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add money to a goal funded by hand, or take some out (once per Idempotency-Key) */
        post: operations["contribute_v1_expenses_goals__goal_id__contributions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/ious": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My loans, most recently lent first: open, settled or all, with one person or all */
        get: operations["list_ious_v1_expenses_ious_get"];
        put?: never;
        /** Note money lent or borrowed (once per Idempotency-Key) */
        post: operations["add_iou_v1_expenses_ious_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/ious/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What is owed to me and what I owe, in all and by person */
        get: operations["summarise_ious_v1_expenses_ious_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/ious/{iou_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** One loan, with what was paid back on it */
        get: operations["get_iou_v1_expenses_ious__iou_id__get"];
        put?: never;
        post?: never;
        /** Delete a loan (it can be brought back) */
        delete: operations["delete_iou_v1_expenses_ious__iou_id__delete"];
        options?: never;
        head?: never;
        /** Change a loan (only what is sent), as of the revision edited */
        patch: operations["change_iou_v1_expenses_ious__iou_id__patch"];
        trace?: never;
    };
    "/v1/expenses/ious/{iou_id}/undelete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Bring a deleted loan back */
        post: operations["undelete_iou_v1_expenses_ious__iou_id__undelete_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/ious/{iou_id}/settlements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Record money paid back on a loan, or correct a payment (once per Idempotency-Key) */
        post: operations["settle_iou_v1_expenses_ious__iou_id__settlements_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/recurring": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What repeats and my bills, soonest due first */
        get: operations["list_rules_v1_expenses_recurring_get"];
        put?: never;
        /** Add something that repeats, or confirm a suggestion (once per signature) */
        post: operations["add_rule_v1_expenses_recurring_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/recurring/suggestions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What looks like it repeats in my entries, as rules to confirm */
        get: operations["list_suggestions_v1_expenses_recurring_suggestions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/recurring/suggestions/dismiss": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Say a suggestion isn't regular: it is not suggested again */
        post: operations["dismiss_suggestion_v1_expenses_recurring_suggestions_dismiss_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/recurring/{rule_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a rule (the entries it added stay) */
        delete: operations["delete_rule_v1_expenses_recurring__rule_id__delete"];
        options?: never;
        head?: never;
        /** Change a rule (only what is sent); pausing stops its entries and reminders */
        patch: operations["change_rule_v1_expenses_recurring__rule_id__patch"];
        trace?: never;
    };
    "/v1/expenses/recurring/{rule_id}/mark-paid": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark a bill's due date paid: its entry is added once per due date */
        post: operations["mark_paid_v1_expenses_recurring__rule_id__mark_paid_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/saved-filters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My saved views of the entries list, by name */
        get: operations["list_saved_filters_v1_expenses_saved_filters_get"];
        put?: never;
        /** Save the entries list's filters under a name */
        post: operations["add_saved_filter_v1_expenses_saved_filters_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/saved-filters/{saved_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a view (the entries stay) */
        delete: operations["delete_saved_filter_v1_expenses_saved_filters__saved_id__delete"];
        options?: never;
        head?: never;
        /** Rename a view, or keep the list's filters as they are now */
        patch: operations["change_saved_filter_v1_expenses_saved_filters__saved_id__patch"];
        trace?: never;
    };
    "/v1/expenses/export.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My entries as a CSV file, with the entries list's filters */
        get: operations["export_entries_v1_expenses_export_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/import/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Read a CSV file into entries, without saving: the columns, a guessed mapping, the first rows and the rows with problems */
        post: operations["preview_import_v1_expenses_import_preview_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/import/commit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add a batch of the file's importable rows (each once per file and row); send next_offset back for the rest */
        post: operations["commit_import_v1_expenses_import_commit_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/reports/monthly": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A month on one page: totals against the month before, where it went, the biggest */
        get: operations["monthly_report_v1_expenses_reports_monthly_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/reports/monthly.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The monthly report's figures as a CSV file */
        get: operations["monthly_report_csv_v1_expenses_reports_monthly_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Answer a question about my entries: a metric, grouped and narrowed (read only) */
        post: operations["query_entries_v1_expenses_query_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/units": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Units a quantity can be in */
        get: operations["list_units_v1_expenses_units_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/expenses/entries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Everyone's entries, or one person's, with the list's filters */
        get: operations["list_all_entries_v1_admin_expenses_entries_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/expenses/entries/{entry_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Correct someone's entry: a revision by the admin, and an audit entry */
        patch: operations["correct_entry_v1_admin_expenses_entries__entry_id__patch"];
        trace?: never;
    };
    "/v1/labor/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What the forms offer and check */
        get: operations["labor_options_v1_labor_options_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Today across my open projects */
        get: operations["labor_overview_v1_labor_overview_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Every change to my projects, newest first */
        get: operations["labor_audit_v1_labor_audit_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My projects, open ones first */
        get: operations["list_projects_v1_labor_projects_get"];
        put?: never;
        /** Add Project */
        post: operations["add_project_v1_labor_projects_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read Project */
        get: operations["read_project_v1_labor_projects__project_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Change Project */
        patch: operations["change_project_v1_labor_projects__project_id__patch"];
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/close": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Close Project */
        post: operations["close_project_v1_labor_projects__project_id__close_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/reopen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reopen Project */
        post: operations["reopen_project_v1_labor_projects__project_id__reopen_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** The usual daily wages for new workers (workers already in keep theirs) */
        put: operations["set_rates_v1_labor_projects__project_id__rates_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/workers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Workers */
        get: operations["list_workers_v1_labor_projects__project_id__workers_get"];
        put?: never;
        /** Add Worker */
        post: operations["add_worker_v1_labor_projects__project_id__workers_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/attendance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A day's attendance */
        get: operations["read_day_v1_labor_projects__project_id__attendance_get"];
        /** Mark workers full, half or absent for a day (a mark already there is changed) */
        put: operations["mark_day_v1_labor_projects__project_id__attendance_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Payments */
        get: operations["list_payments_v1_labor_projects__project_id__payments_get"];
        put?: never;
        /** Record money paid to a worker (sent twice with one Idempotency-Key, kept once) */
        post: operations["add_payment_v1_labor_projects__project_id__payments_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/attendance/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Read marks said or typed into a draft to check (mark-attendance); nothing is saved */
        post: operations["read_marks_said_v1_labor_projects__project_id__attendance_read_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Earned and paid, by day, week or month and by worker, with what is owed */
        get: operations["project_report_v1_labor_projects__project_id__report_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/projects/{project_id}/report.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The report as a CSV file: its figures, then each day marked and each payment */
        get: operations["project_report_file_v1_labor_projects__project_id__report_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/workers/{worker_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read Worker */
        get: operations["read_worker_v1_labor_workers__worker_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Change Worker */
        patch: operations["change_worker_v1_labor_workers__worker_id__patch"];
        trace?: never;
    };
    "/v1/labor/workers/{worker_id}/wage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** A new daily wage from a day on (past attendance keeps its rate) */
        put: operations["set_wage_v1_labor_workers__worker_id__wage_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/workers/{worker_id}/wages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A worker's wage history, newest first */
        get: operations["wage_history_v1_labor_workers__worker_id__wages_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/workers/{worker_id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A worker's days and payments between two days, newest first */
        get: operations["worker_history_v1_labor_workers__worker_id__history_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/workers/{worker_id}/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Set Active */
        put: operations["set_active_v1_labor_workers__worker_id__active_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/workers/{worker_id}/photo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A worker's photo, only to their owner */
        get: operations["read_photo_v1_labor_workers__worker_id__photo_get"];
        /** A worker's photo: the body, a JPEG, PNG or WebP */
        put: operations["put_photo_v1_labor_workers__worker_id__photo_put"];
        post?: never;
        /** Remove Photo */
        delete: operations["remove_photo_v1_labor_workers__worker_id__photo_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/workers/{worker_id}/id-card": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The picture of a worker's ID, only to their owner */
        get: operations["read_id_card_v1_labor_workers__worker_id__id_card_get"];
        /** A picture of a worker's ID, if the owner keeps one: a JPEG, PNG or WebP */
        put: operations["put_id_card_v1_labor_workers__worker_id__id_card_put"];
        post?: never;
        /** Remove Id Card */
        delete: operations["remove_id_card_v1_labor_workers__worker_id__id_card_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labor/payments/{payment_id}/void": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Void a mistaken payment, with the reason (it stays in the history) */
        post: operations["void_payment_v1_labor_payments__payment_id__void_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/labor/owners": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The accounts given Labor, with their projects and workers */
        get: operations["list_owners_v1_admin_labor_owners_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/labor/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Every owner's projects, open ones first */
        get: operations["list_projects_v1_admin_labor_projects_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/labor/projects/{project_id}/workers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Workers */
        get: operations["list_workers_v1_admin_labor_projects__project_id__workers_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/labor/projects/{project_id}/report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Project Report */
        get: operations["project_report_v1_admin_labor_projects__project_id__report_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/labor/projects/{project_id}/report.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A project's report as a CSV file, as its owner gets it */
        get: operations["project_report_file_v1_admin_labor_projects__project_id__report_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/labor/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Every owner's changes, newest first */
        get: operations["labor_audit_v1_admin_labor_audit_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/receipts/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What the receipt form offers and starts with */
        get: operations["receipt_options_v1_receipts_options_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/receipts/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My receipts, latest bought first: all, by where their warranty stands, or by words */
        get: operations["list_items_v1_receipts_items_get"];
        put?: never;
        /** Keep a receipt, reminded before its warranty ends */
        post: operations["add_item_v1_receipts_items_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/receipts/items/{item_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Item */
        get: operations["get_item_v1_receipts_items__item_id__get"];
        put?: never;
        post?: never;
        /** Delete Item */
        delete: operations["delete_item_v1_receipts_items__item_id__delete"];
        options?: never;
        head?: never;
        /** Change Item */
        patch: operations["change_item_v1_receipts_items__item_id__patch"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AccountDeleteIn */
        AccountDeleteIn: {
            /** Confirm Email */
            confirm_email: string;
            /** Password */
            password?: string | null;
            /** Google Id Token */
            google_id_token?: string | null;
            /** Code */
            code?: string | null;
        };
        /**
         * AccountState
         * @enum {string}
         */
        AccountState: "active" | "disabled" | "all";
        /** ActiveIn */
        ActiveIn: {
            /** Active */
            active: boolean;
            /** Note */
            note?: string | null;
        };
        /** ActivityOut */
        ActivityOut: {
            /** Id */
            id: string;
            /** Type */
            type: string;
            /** Params */
            params: {
                [key: string]: unknown;
            };
            /**
             * At
             * Format: date-time
             */
            at: string;
        };
        /** AdminEntryOut */
        AdminEntryOut: {
            /** @default expense */
            kind: components["schemas"]["EntryKind"];
            /** Title */
            title: string;
            /**
             * Amount Minor
             * @description In the currency's minor unit
             */
            amount_minor: number;
            /** Currency */
            currency: string;
            /**
             * Quantity
             * @description How much was bought, in `unit`
             */
            quantity?: number | null;
            /**
             * Unit
             * @description A code from GET /units
             */
            unit?: string | null;
            /** Category Id */
            category_id: string;
            /**
             * Date
             * Format: date
             * @description The calendar day it happened
             */
            date: string;
            /** Time */
            time?: string | null;
            /** Merchant */
            merchant?: string | null;
            payment_mode?: components["schemas"]["PaymentMode"] | null;
            /** For Whom */
            for_whom?: string | null;
            /**
             * Tags
             * @default []
             */
            tags: string[];
            /** Note */
            note?: string | null;
            /**
             * Attachments
             * @default []
             */
            attachments: components["schemas"]["AttachmentIn"][];
            /** Id */
            id: string;
            /**
             * Base Currency
             * @description The currency it counts in
             */
            base_currency?: string | null;
            /**
             * Fx Rate
             * @description base_currency one currency bought
             */
            fx_rate?: string | null;
            /**
             * Amount Base Minor
             * @description What it was in base_currency
             */
            amount_base_minor?: number | null;
            source: components["schemas"]["EntrySource"];
            /**
             * Recurring Id
             * @description The repeating rule that added it, or whose bill it paid
             */
            recurring_id?: string | null;
            /** Revision No */
            revision_no: number;
            /** Deleted */
            deleted: boolean;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** User Id */
            user_id: string;
        };
        /**
         * AdminEntryPatch
         * @description A correction: only the fields sent change, the rest stay as they are.
         */
        AdminEntryPatch: {
            /**
             * Revision No
             * @description The revision corrected (409 if it moved on)
             */
            revision_no: number;
            /** Reason */
            reason: string;
            kind?: components["schemas"]["EntryKind"] | null;
            /** Title */
            title?: string | null;
            /** Amount Minor */
            amount_minor?: number | null;
            /** Category Id */
            category_id?: string | null;
            /** Date */
            date?: string | null;
            /** Merchant */
            merchant?: string | null;
            payment_mode?: components["schemas"]["PaymentMode"] | null;
            /** For Whom */
            for_whom?: string | null;
            /** Tags */
            tags?: string[] | null;
            /** Note */
            note?: string | null;
        };
        /** AdminModuleOut */
        AdminModuleOut: {
            /** Key */
            key: string;
            manifest_status: components["schemas"]["ModuleStatus"];
            /** Manifest Order */
            manifest_order: number;
            /** @description What users see: the override, else the manifest */
            status: components["schemas"]["ModuleStatus"];
            /** Global Enabled */
            global_enabled: boolean;
            /** Order */
            order: number;
            /**
             * Overridden
             * @description The fields an admin set
             */
            overridden: string[];
            /**
             * Audience
             * @description granted: only the accounts an admin gives it to (and admins) see it
             * @enum {string}
             */
            audience: "everyone" | "granted";
        };
        /**
         * AdminModulePatch
         * @description Only what is sent changes; null sets a field back to the manifest's.
         */
        AdminModulePatch: {
            status?: components["schemas"]["ModuleStatus"] | null;
            /** Global Enabled */
            global_enabled?: boolean | null;
            /** Order */
            order?: number | null;
        };
        /** AdminUserCreated */
        AdminUserCreated: {
            user: components["schemas"]["AdminUserOut"];
            /**
             * One Time Password
             * @description Shown once, never stored in the clear
             */
            one_time_password: string;
        };
        /** AdminUserDetail */
        AdminUserDetail: {
            /** Id */
            id: string;
            /** Email */
            email: string;
            /** Name */
            name: string;
            role: components["schemas"]["Role"];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Last Login At */
            last_login_at: string | null;
            /** Disabled */
            disabled: boolean;
            /** Must Change Password */
            must_change_password: boolean;
            /** Two Factor */
            two_factor: boolean;
            /** Locked */
            locked: boolean;
            /** Providers */
            providers: string[];
            /**
             * Modules
             * @description Modules only some accounts may use, given to it
             */
            modules: string[];
            /** Live Sessions */
            live_sessions: number;
        };
        /**
         * AdminUserIn
         * @description An account the admin makes: it signs in with a one-time password and changes it.
         */
        AdminUserIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Name */
            name: string;
            /**
             * Modules
             * @description Modules only some accounts may use
             */
            modules?: string[];
        };
        /** AdminUserOut */
        AdminUserOut: {
            /** Id */
            id: string;
            /** Email */
            email: string;
            /** Name */
            name: string;
            role: components["schemas"]["Role"];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Last Login At */
            last_login_at: string | null;
            /** Disabled */
            disabled: boolean;
            /** Must Change Password */
            must_change_password: boolean;
            /** Two Factor */
            two_factor: boolean;
            /** Locked */
            locked: boolean;
            /** Providers */
            providers: string[];
            /**
             * Modules
             * @description Modules only some accounts may use, given to it
             */
            modules: string[];
        };
        /** AdminUserPatch */
        AdminUserPatch: {
            role?: components["schemas"]["Role"] | null;
            /** Disabled */
            disabled?: boolean | null;
        };
        /**
         * AgentMode
         * @enum {string}
         */
        AgentMode: "agent" | "static";
        /** AgentView */
        AgentView: {
            /** Name */
            name: string;
            /** Description */
            description: string;
            /** @description What a run would use right now; null = unavailable */
            mode: components["schemas"]["AgentMode"] | null;
            reason: components["schemas"]["Blocker"] | null;
            /** Fallback */
            fallback: boolean;
            /** Quota Remaining */
            quota_remaining: number;
            /** Skills */
            skills: components["schemas"]["SkillView"][];
        };
        /** AiUsage */
        AiUsage: {
            /** Runs */
            runs: number;
            /** By Ai */
            by_ai: number;
            /** By Rules */
            by_rules: number;
            /** Fell Back */
            fell_back: number;
            /** Fallback Rate Pct */
            fallback_rate_pct: number | null;
            /** Calls By Provider */
            calls_by_provider: {
                [key: string]: number;
            };
        };
        /** AllowedIn */
        AllowedIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Note */
            note?: string | null;
        };
        /** AllowedOut */
        AllowedOut: {
            /** Email */
            email: string;
            source: components["schemas"]["AllowedSource"];
            /** Note */
            note?: string | null;
            /** Added At */
            added_at?: string | null;
        };
        /**
         * AllowedSource
         * @enum {string}
         */
        AllowedSource: "settings" | "admin";
        /** AnomaliesOut */
        AnomaliesOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            /** Items */
            items: components["schemas"]["Unusual"][];
        };
        /** AttachmentIn */
        AttachmentIn: {
            /**
             * Url
             * Format: uri
             */
            url: string;
            /** Label */
            label?: string | null;
        };
        /**
         * AttendanceDraftIn
         * @description A day's marks as said. Leave out what wasn't said.
         */
        AttendanceDraftIn: {
            /**
             * Project Id
             * @description The project's id from labor_day
             */
            project_id?: string | null;
            /**
             * Day
             * @description YYYY-MM-DD; never later than today
             */
            day?: string | null;
            /**
             * Marks
             * @default []
             */
            marks: components["schemas"]["DraftMarkIn"][];
            /**
             * Rest
             * @description The mark for every worker not named, if said
             */
            rest?: ("full" | "half" | "absent") | null;
            /**
             * Uncertain
             * @description What was guessed
             * @default []
             */
            uncertain: ("day" | "rest")[];
        };
        /**
         * AttendanceStatus
         * @enum {string}
         */
        AttendanceStatus: "full" | "half" | "absent";
        /** AuditOut */
        AuditOut: {
            /** Id */
            id: string;
            /**
             * At
             * Format: date-time
             */
            at: string;
            /** Action */
            action: string;
            /** Actor Id */
            actor_id: string | null;
            /** Actor Email */
            actor_email: string | null;
            /** Entity */
            entity: string;
            /** Entity Id */
            entity_id: string | null;
            /** Owner Id */
            owner_id: string | null;
            /** Owner Email */
            owner_email: string | null;
            /** Details */
            details: {
                [key: string]: unknown;
            };
            /** Ip */
            ip: string | null;
            /** Request Id */
            request_id: string | null;
        };
        /** AuthConfigOut */
        AuthConfigOut: {
            registration_mode: components["schemas"]["RegistrationMode"];
            /** Google Client Id */
            google_client_id: string | null;
            password_policy: components["schemas"]["PasswordPolicyOut"];
            /** Csrf Header */
            csrf_header: string;
        };
        /**
         * Blocker
         * @enum {string}
         */
        Blocker: "consent" | "quota" | "no_provider" | "providers_failed" | "no_static";
        /** BudgetIn */
        BudgetIn: {
            /** Name */
            name: string;
            scope: components["schemas"]["BudgetScope"];
            /** Category Id */
            category_id?: string | null;
            /** Tag */
            tag?: string | null;
            period: components["schemas"]["BudgetPeriod"];
            /**
             * Start
             * @description First day (custom budgets only)
             */
            start?: string | null;
            /**
             * End
             * @description Last day, inclusive (custom only)
             */
            end?: string | null;
            /**
             * Limit Minor
             * @description In the base currency's minor unit
             */
            limit_minor: number;
            /**
             * Alert Threshold
             * @description Warn once at this share of the limit; 0 = only when over
             */
            alert_threshold?: number;
        };
        /** BudgetOut */
        BudgetOut: {
            /** Name */
            name: string;
            scope: components["schemas"]["BudgetScope"];
            /** Category Id */
            category_id?: string | null;
            /** Tag */
            tag?: string | null;
            period: components["schemas"]["BudgetPeriod"];
            /**
             * Start
             * @description First day (custom budgets only)
             */
            start?: string | null;
            /**
             * End
             * @description Last day, inclusive (custom only)
             */
            end?: string | null;
            /**
             * Limit Minor
             * @description In the base currency's minor unit
             */
            limit_minor: number;
            /** Alert Threshold */
            alert_threshold: number;
            /** Id */
            id: string;
            /** Currency */
            currency: string;
            status: components["schemas"]["BudgetStatus"];
        };
        /**
         * BudgetPatch
         * @description Only what is sent changes (``null`` clears a field). The budget it leaves must still fit
         *     together: its scope and period with their fields.
         */
        BudgetPatch: {
            /** Name */
            name?: string | null;
            scope?: components["schemas"]["BudgetScope"] | null;
            /** Category Id */
            category_id?: string | null;
            /** Tag */
            tag?: string | null;
            period?: components["schemas"]["BudgetPeriod"] | null;
            /** Start */
            start?: string | null;
            /** End */
            end?: string | null;
            /** Limit Minor */
            limit_minor?: number | null;
            /** Alert Threshold */
            alert_threshold?: number | null;
        };
        /**
         * BudgetPeriod
         * @enum {string}
         */
        BudgetPeriod: "week" | "month" | "custom";
        /**
         * BudgetScope
         * @description What a budget counts: all spending, one category, or one tag (a trip, an event).
         * @enum {string}
         */
        BudgetScope: "overall" | "category" | "tag";
        /**
         * BudgetState
         * @enum {string}
         */
        BudgetState: "ok" | "near" | "over" | "upcoming" | "ended";
        /**
         * BudgetStatus
         * @description How a budget stands today, over its current window: this week or month, or its dates.
         */
        BudgetStatus: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Spent Minor */
            spent_minor: number;
            /**
             * Left Minor
             * @description Negative when over the limit
             */
            left_minor: number;
            /**
             * Pct
             * @description Share of the limit spent, in whole percent rounded down
             */
            pct: number;
            state: components["schemas"]["BudgetState"];
            /**
             * Days Left
             * @description Days of the window still to come, today included
             */
            days_left: number;
            /**
             * Per Day Left Minor
             * @description What is left, spread over the days left
             */
            per_day_left_minor: number;
            /**
             * Pace Minor
             * @description What spending at an even pace would reach by today
             */
            pace_minor: number;
        };
        /**
         * BulkAction
         * @enum {string}
         */
        BulkAction: "category" | "add_tag" | "remove_tag" | "delete" | "undelete";
        /**
         * BulkIn
         * @description One change to many entries: the category, a tag added or taken off, or delete (and
         *     bring back).
         */
        BulkIn: {
            /** Ids */
            ids: string[];
            action: components["schemas"]["BulkAction"];
            /**
             * Category Id
             * @description For category
             */
            category_id?: string | null;
            /**
             * Tag
             * @description For add_tag and remove_tag
             */
            tag?: string | null;
        };
        /** BulkOut */
        BulkOut: {
            /**
             * Changed
             * @description The entries changed, in the order asked
             */
            changed: string[];
            /** Skipped */
            skipped: components["schemas"]["BulkSkip"][];
        };
        /** BulkSkip */
        BulkSkip: {
            /** Id */
            id: string;
            reason: components["schemas"]["SkipReason"];
        };
        /** ByCategoryOut */
        ByCategoryOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            kind: components["schemas"]["EntryKind"];
            /** Total Minor */
            total_minor: number;
            /** Items */
            items: components["schemas"]["CategoryShare"][];
        };
        /** ByPersonOut */
        ByPersonOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            kind: components["schemas"]["EntryKind"];
            /** Total Minor */
            total_minor: number;
            /** Items */
            items: components["schemas"]["PersonShare"][];
        };
        /** CadenceFields */
        CadenceFields: {
            unit: components["schemas"]["CadenceUnit"];
            /**
             * Every
             * @description Every this many days, weeks ...
             * @default 1
             */
            every: number;
            /**
             * Anchor
             * Format: date
             * @description A due date (the first): the others follow from it, on the same day of the month, or the month's last day when it is shorter
             */
            anchor: string;
        };
        /** CadenceIn */
        CadenceIn: {
            unit: components["schemas"]["CadenceUnit"];
            /**
             * Every
             * @description Every this many days, weeks ...
             * @default 1
             */
            every: number;
            /**
             * Anchor
             * Format: date
             * @description A due date (the first): the others follow from it, on the same day of the month, or the month's last day when it is shorter
             */
            anchor: string;
        };
        /**
         * CadenceUnit
         * @enum {string}
         */
        CadenceUnit: "day" | "week" | "month" | "year";
        /** CategoryIn */
        CategoryIn: {
            /** @default expense */
            kind: components["schemas"]["EntryKind"];
            /** Name */
            name: string;
            /** Icon */
            icon: string;
            /** Accent */
            accent: string;
        };
        /**
         * CategoryOut
         * @description ``key`` (system) is translated by the client; ``name`` (custom) is the user's text.
         */
        CategoryOut: {
            /** Id */
            id: string;
            kind: components["schemas"]["EntryKind"];
            /** Key */
            key?: string | null;
            /** Name */
            name?: string | null;
            /** Icon */
            icon: string;
            /** Accent */
            accent: string;
            /**
             * System
             * @default false
             */
            system: boolean;
            /**
             * Archived
             * @default false
             */
            archived: boolean;
        };
        /**
         * CategoryPatch
         * @description The kind is fixed: entries already filed under the category rely on it.
         */
        CategoryPatch: {
            /** Name */
            name?: string | null;
            /** Icon */
            icon?: string | null;
            /** Accent */
            accent?: string | null;
        };
        /** CategoryShare */
        CategoryShare: {
            /** Amount Minor */
            amount_minor: number;
            /** Count */
            count: number;
            /** Share Pct */
            share_pct: number;
            /** Category Id */
            category_id: string;
        };
        /** ClientAction */
        ClientAction: {
            /** Tool */
            tool: string;
            /** Arguments */
            arguments: {
                [key: string]: unknown;
            };
        };
        /** CodeCount */
        CodeCount: {
            /** Code */
            code: string;
            /** Count */
            count: number;
        };
        /** CollectionSize */
        CollectionSize: {
            /** Name */
            name: string;
            /** Count */
            count: number;
            /** Size Mb */
            size_mb: number;
            /** Storage Mb */
            storage_mb: number;
            /** Index Mb */
            index_mb: number;
        };
        /**
         * ColumnMapping
         * @description Which column holds what, and how its days and amounts are written. A guess may lack a
         *     column it couldn't name; the user says which.
         */
        ColumnMapping: {
            /**
             * Header Row
             * @description The row, from 0, that names the columns
             */
            header_row: number;
            /**
             * Columns
             * @description Field -> its column, from 0
             */
            columns: {
                [key: string]: number;
            };
            /**
             * Date Format
             * @description One of date_formats, as the preview offers them
             */
            date_format: string;
            /** @default expense */
            signs: components["schemas"]["Signs"];
        };
        /**
         * CommitIn
         * @description The file and the mapping the preview showed, and which of its importable rows to add
         *     now: from ``offset``, at most ``limits.commit_batch`` of them.
         */
        CommitIn: {
            /**
             * File
             * Format: base64
             * @description The CSV file, base64-encoded
             */
            file: string;
            mapping: components["schemas"]["ImportMapping"];
            /**
             * Include Duplicates
             * @description Also add rows that look saved already
             * @default false
             */
            include_duplicates: boolean;
            /**
             * Offset
             * @description Importable rows done so far
             * @default 0
             */
            offset: number;
        };
        /** CommitOut */
        CommitOut: {
            /**
             * Added
             * @description Entries this request added
             */
            added: number;
            /**
             * Already
             * @description Rows of this file an earlier import added already
             */
            already: number;
            /**
             * Done
             * @description Importable rows done, with this request
             */
            done: number;
            /**
             * Total
             * @description Importable rows in the file
             */
            total: number;
            /**
             * Next Offset
             * @description Send this as offset for the rest; None: done
             */
            next_offset: number | null;
        };
        /** ContributionIn */
        ContributionIn: {
            /**
             * Amount Minor
             * @description Negative to take money out
             */
            amount_minor: number;
            /**
             * Date
             * @description Default today; never after today
             */
            date?: string | null;
            /** Note */
            note?: string | null;
        };
        /** CumulativeOut */
        CumulativeOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            kind: components["schemas"]["EntryKind"];
            /** Points */
            points: components["schemas"]["RunningTotal"][];
            previous: components["schemas"]["Span"];
            /** Previous Points */
            previous_points: components["schemas"]["RunningTotal"][];
        };
        /**
         * CurrencyTotal
         * @description Totals are per currency: amounts in different currencies are never added together.
         */
        CurrencyTotal: {
            /** Currency */
            currency: string;
            /**
             * Expense Minor
             * @default 0
             */
            expense_minor: number;
            /**
             * Income Minor
             * @default 0
             */
            income_minor: number;
            /**
             * Count
             * @default 0
             */
            count: number;
        };
        /** DailyOut */
        DailyOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            kind: components["schemas"]["EntryKind"];
            /** Points */
            points: components["schemas"]["DayAmount"][];
        };
        /** DashboardOut */
        DashboardOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Widgets */
            widgets: components["schemas"]["WidgetView"][];
        };
        /** DateChoice */
        DateChoice: {
            /** Format */
            format: string;
            /**
             * Example
             * @description 31 October 2026 written this way
             */
            example: string;
        };
        /** DayAmount */
        DayAmount: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Amount Minor */
            amount_minor: number;
            /**
             * Count
             * @default 0
             */
            count: number;
        };
        /** DayCount */
        DayCount: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Count */
            count: number;
        };
        /** DbOut */
        DbOut: {
            /** Database */
            database: string;
            /** Data Mb */
            data_mb: number;
            /** Storage Mb */
            storage_mb: number;
            /** Index Mb */
            index_mb: number;
            /** Quota Mb */
            quota_mb: number;
            /** Used Pct */
            used_pct: number;
            /** Collections */
            collections: components["schemas"]["CollectionSize"][];
        };
        /** DismissIn */
        DismissIn: {
            /** Signature */
            signature: string;
        };
        /** DraftMarkIn */
        DraftMarkIn: {
            /**
             * Worker Id
             * @description The worker's id from labor_day; left out when no one matched
             */
            worker_id?: string | null;
            /**
             * Name
             * @description Their name, or the words heard
             */
            name: string;
            /**
             * Status
             * @description Their mark; left out if not said
             */
            status?: ("full" | "half" | "absent") | null;
            /**
             * Uncertain
             * @description What was guessed: who, or which mark
             * @default []
             */
            uncertain: ("worker" | "status")[];
        };
        /**
         * DuplicateCandidate
         * @description An entry about to be saved, as far as telling it from saved ones needs.
         */
        DuplicateCandidate: {
            /** @default expense */
            kind: components["schemas"]["EntryKind"];
            /** Title */
            title: string;
            /**
             * Amount Minor
             * @description In the base currency's minor unit
             */
            amount_minor: number;
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Merchant */
            merchant?: string | null;
            /**
             * Exclude Id
             * @description The entry being edited, never its own match
             */
            exclude_id?: string | null;
        };
        /** DuplicateResult */
        DuplicateResult: {
            /**
             * Index
             * @description The candidate's place in the request
             */
            index: number;
            /** Matches */
            matches: components["schemas"]["EntryOut"][];
        };
        /** DuplicatesIn */
        DuplicatesIn: {
            /** Candidates */
            candidates: components["schemas"]["DuplicateCandidate"][];
        };
        /**
         * DuplicatesOut
         * @description One result per candidate, in the order asked. Advice only: saving is never refused.
         */
        DuplicatesOut: {
            /** Results */
            results: components["schemas"]["DuplicateResult"][];
        };
        /** EndpointIn */
        EndpointIn: {
            /** Endpoint */
            endpoint: string;
        };
        /** EntryIn */
        EntryIn: {
            /** @default expense */
            kind: components["schemas"]["EntryKind"];
            /** Title */
            title: string;
            /**
             * Amount Minor
             * @description In the currency's minor unit
             */
            amount_minor: number;
            /**
             * Currency
             * @description Default: my base currency
             */
            currency?: string | null;
            /**
             * Quantity
             * @description How much was bought, in `unit`
             */
            quantity?: number | null;
            /**
             * Unit
             * @description A code from GET /units
             */
            unit?: string | null;
            /** Category Id */
            category_id: string;
            /**
             * Date
             * Format: date
             * @description The calendar day it happened
             */
            date: string;
            /** Time */
            time?: string | null;
            /** Merchant */
            merchant?: string | null;
            payment_mode?: components["schemas"]["PaymentMode"] | null;
            /** For Whom */
            for_whom?: string | null;
            /**
             * Tags
             * @default []
             */
            tags: string[];
            /** Note */
            note?: string | null;
            /**
             * Attachments
             * @default []
             */
            attachments: components["schemas"]["AttachmentIn"][];
        };
        /**
         * EntryKind
         * @enum {string}
         */
        EntryKind: "expense" | "income";
        /** EntryOut */
        EntryOut: {
            /** @default expense */
            kind: components["schemas"]["EntryKind"];
            /** Title */
            title: string;
            /**
             * Amount Minor
             * @description In the currency's minor unit
             */
            amount_minor: number;
            /** Currency */
            currency: string;
            /**
             * Quantity
             * @description How much was bought, in `unit`
             */
            quantity?: number | null;
            /**
             * Unit
             * @description A code from GET /units
             */
            unit?: string | null;
            /** Category Id */
            category_id: string;
            /**
             * Date
             * Format: date
             * @description The calendar day it happened
             */
            date: string;
            /** Time */
            time?: string | null;
            /** Merchant */
            merchant?: string | null;
            payment_mode?: components["schemas"]["PaymentMode"] | null;
            /** For Whom */
            for_whom?: string | null;
            /**
             * Tags
             * @default []
             */
            tags: string[];
            /** Note */
            note?: string | null;
            /**
             * Attachments
             * @default []
             */
            attachments: components["schemas"]["AttachmentIn"][];
            /** Id */
            id: string;
            /**
             * Base Currency
             * @description The currency it counts in
             */
            base_currency?: string | null;
            /**
             * Fx Rate
             * @description base_currency one currency bought
             */
            fx_rate?: string | null;
            /**
             * Amount Base Minor
             * @description What it was in base_currency
             */
            amount_base_minor?: number | null;
            source: components["schemas"]["EntrySource"];
            /**
             * Recurring Id
             * @description The repeating rule that added it, or whose bill it paid
             */
            recurring_id?: string | null;
            /** Revision No */
            revision_no: number;
            /** Deleted */
            deleted: boolean;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /**
         * EntrySource
         * @description How an entry, or a change to it, was made.
         * @enum {string}
         */
        EntrySource: "manual" | "assistant" | "recurring" | "bulk" | "import" | "admin";
        /**
         * EntryUpdate
         * @description The whole entry as edited, plus the revision that was edited: if the entry has moved
         *     on since, the answer is 409 rather than one change silently replacing the other.
         */
        EntryUpdate: {
            /** @default expense */
            kind: components["schemas"]["EntryKind"];
            /** Title */
            title: string;
            /**
             * Amount Minor
             * @description In the currency's minor unit
             */
            amount_minor: number;
            /**
             * Currency
             * @description Default: my base currency
             */
            currency?: string | null;
            /**
             * Quantity
             * @description How much was bought, in `unit`
             */
            quantity?: number | null;
            /**
             * Unit
             * @description A code from GET /units
             */
            unit?: string | null;
            /** Category Id */
            category_id: string;
            /**
             * Date
             * Format: date
             * @description The calendar day it happened
             */
            date: string;
            /** Time */
            time?: string | null;
            /** Merchant */
            merchant?: string | null;
            payment_mode?: components["schemas"]["PaymentMode"] | null;
            /** For Whom */
            for_whom?: string | null;
            /**
             * Tags
             * @default []
             */
            tags: string[];
            /** Note */
            note?: string | null;
            /**
             * Attachments
             * @default []
             */
            attachments: components["schemas"]["AttachmentIn"][];
            /** Revision No */
            revision_no: number;
        };
        /**
         * ErrorResponse
         * @description Body of every non-2xx response.
         */
        ErrorResponse: {
            /**
             * Code
             * @example NOT_FOUND
             */
            code: string;
            /**
             * Message
             * @example Resource not found.
             */
            message: string;
            /** Details */
            details?: unknown;
            /**
             * Request Id
             * @example 5f0c3e7a9b2d4c1e8f6a0b3c2d1e4f5a
             */
            request_id?: string | null;
        };
        /**
         * ExpenseQuery
         * @description A question about the user's entries, as data: what to work out, of which entries, by
         *     what. It is compiled from a whitelist (compiler.py), so it can only ever read the user's own
         *     entries, in fixed shapes.
         */
        ExpenseQuery: {
            /** @default total */
            metric: components["schemas"]["Metric"];
            /**
             * @description None for both (then group by kind)
             * @default expense
             */
            kind: components["schemas"]["EntryKind"] | null;
            /** @default none */
            group_by: components["schemas"]["GroupBy"];
            /**
             * Start
             * @description First day
             */
            start?: string | null;
            /**
             * End
             * @description Last day, inclusive
             */
            end?: string | null;
            /**
             * Category Ids
             * @default []
             */
            category_ids: string[];
            /**
             * Merchant
             * @description This place exactly (any case)
             */
            merchant?: string | null;
            /**
             * Person
             * @description For this person exactly (any case)
             */
            person?: string | null;
            /** Tag */
            tag?: string | null;
            /**
             * Text
             * @description Words in the title, place or note
             */
            text?: string | null;
            /** Min Amount Minor */
            min_amount_minor?: number | null;
            /** Max Amount Minor */
            max_amount_minor?: number | null;
            /** @default value_desc */
            sort: components["schemas"]["SortOrder"];
            /**
             * Limit
             * @default 10
             */
            limit: number;
        };
        /**
         * FacetsOut
         * @description What the user has typed before, for suggestions while they type.
         */
        FacetsOut: {
            /** Tags */
            tags: string[];
            /** For Whom */
            for_whom: string[];
            /** Merchants */
            merchants: string[];
        };
        /** FieldChange */
        FieldChange: {
            /** Field */
            field: string;
            /** Old */
            old?: unknown;
            /** New */
            new?: unknown;
        };
        /** ForecastOut */
        ForecastOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            /** Month */
            month: string;
            /**
             * Today
             * Format: date
             */
            today: string;
            /** Spent Minor */
            spent_minor: number;
            /** Days Left */
            days_left: number;
            /** Pace Daily Minor */
            pace_daily_minor: number;
            /** Projected Minor */
            projected_minor: number;
            /** Low Minor */
            low_minor: number;
            /** High Minor */
            high_minor: number;
            /** Lookback Days */
            lookback_days: number;
            /** Previous Month Minor */
            previous_month_minor: number;
        };
        /**
         * Gender
         * @enum {string}
         */
        Gender: "female" | "male" | "other";
        /**
         * GoalFunding
         * @enum {string}
         */
        GoalFunding: "manual" | "net_savings";
        /** GoalIn */
        GoalIn: {
            /** Name */
            name: string;
            /**
             * Target Minor
             * @description In the base currency's minor unit
             */
            target_minor: number;
            /**
             * Target Date
             * @description When it should be reached
             */
            target_date?: string | null;
            /** @default manual */
            funding: components["schemas"]["GoalFunding"];
            /**
             * Since
             * @description Net-savings goals count from this day (default: today)
             */
            since?: string | null;
        };
        /** GoalOut */
        GoalOut: {
            /** Name */
            name: string;
            /**
             * Target Minor
             * @description In the base currency's minor unit
             */
            target_minor: number;
            /**
             * Target Date
             * @description When it should be reached
             */
            target_date?: string | null;
            /** @default manual */
            funding: components["schemas"]["GoalFunding"];
            /**
             * Since
             * Format: date
             */
            since: string;
            /** Saved Minor */
            saved_minor: number;
            /**
             * Left Minor
             * @description Still to save; 0 once reached
             */
            left_minor: number;
            /**
             * Pct
             * @description Share of the target saved, in whole percent rounded down
             */
            pct: number;
            /**
             * Per Month Minor
             * @description To save each month, this one included, to reach it by its date; null without a date, once reached, or when the date has passed
             */
            per_month_minor: number | null;
            /** Reached */
            reached: boolean;
            /** Id */
            id: string;
            /** Currency */
            currency: string;
            /** Revision No */
            revision_no: number;
        };
        /**
         * GoalPatch
         * @description Only what is sent changes (``null`` clears the date), plus the revision that was edited:
         *     if the goal has moved on since (money was added), the answer is 409.
         */
        GoalPatch: {
            /** Name */
            name?: string | null;
            /** Target Minor */
            target_minor?: number | null;
            /** Target Date */
            target_date?: string | null;
            funding?: components["schemas"]["GoalFunding"] | null;
            /** Since */
            since?: string | null;
            /** Revision No */
            revision_no: number;
        };
        /** GoogleSignInIn */
        GoogleSignInIn: {
            /** Id Token */
            id_token: string;
        };
        /**
         * GroupBy
         * @enum {string}
         */
        GroupBy: "none" | "category" | "merchant" | "person" | "tag" | "day" | "month" | "kind" | "payment_mode";
        /**
         * Grouping
         * @enum {string}
         */
        Grouping: "day" | "week" | "month";
        /** HealthStatus */
        HealthStatus: {
            /**
             * Status
             * @constant
             */
            status: "ok";
            /** Name */
            name: string;
            /** Version */
            version: string;
        };
        /** HeatDay */
        HeatDay: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Amount Minor */
            amount_minor: number;
        };
        /** HeatWeek */
        HeatWeek: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /** Days */
            days: (components["schemas"]["HeatDay"] | null)[];
        };
        /** HeatmapOut */
        HeatmapOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            kind: components["schemas"]["EntryKind"];
            /** Weeks */
            weeks: components["schemas"]["HeatWeek"][];
            /** Weekdays */
            weekdays: components["schemas"]["WeekdayAmount"][];
        };
        /**
         * ImportEntry
         * @description A row as it would be saved.
         */
        ImportEntry: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Time */
            time: string | null;
            kind: components["schemas"]["EntryKind"];
            /** Title */
            title: string;
            /** Amount Minor */
            amount_minor: number;
            /** Currency */
            currency: string;
            /** Category Id */
            category_id: string;
            /**
             * Category Guessed
             * @description The row named no category of the user's
             */
            category_guessed: boolean;
            /** Quantity */
            quantity: number | null;
            /** Unit */
            unit: string | null;
            /** Merchant */
            merchant: string | null;
            payment_mode: components["schemas"]["PaymentMode"] | null;
            /** For Whom */
            for_whom: string | null;
            /** Tags */
            tags: string[];
            /** Note */
            note: string | null;
        };
        /**
         * ImportField
         * @description What a column can hold. An amount comes from ``amount`` (with ``kind`` or its sign) or
         *     from ``debit`` and ``credit`` columns, as bank statements have them.
         * @enum {string}
         */
        ImportField: "date" | "time" | "title" | "amount" | "debit" | "credit" | "kind" | "currency" | "category" | "quantity" | "unit" | "merchant" | "payment_mode" | "for_whom" | "tags" | "note";
        /** ImportIn */
        ImportIn: {
            /**
             * File
             * Format: base64
             * @description The CSV file, base64-encoded
             */
            file: string;
            /** @description Leave out to have it guessed from the file */
            mapping?: components["schemas"]["ImportMapping"] | null;
        };
        /**
         * ImportMapping
         * @description A mapping the user gives: enough to make entries.
         */
        ImportMapping: {
            /**
             * Header Row
             * @description The row, from 0, that names the columns
             */
            header_row: number;
            /**
             * Columns
             * @description Field -> its column, from 0
             */
            columns: {
                [key: string]: number;
            };
            /**
             * Date Format
             * @description One of date_formats, as the preview offers them
             */
            date_format: string;
            /** @default expense */
            signs: components["schemas"]["Signs"];
        };
        /** ImportRow */
        ImportRow: {
            /**
             * Line
             * @description The row's number, as a spreadsheet shows it
             */
            line: number;
            /** @description None when a problem stops it */
            entry: components["schemas"]["ImportEntry"] | null;
            /** Problems */
            problems: components["schemas"]["ProblemCode"][];
            /**
             * Duplicate
             * @description An entry like it (day, kind, amount, title) is saved
             */
            duplicate: boolean;
        };
        /**
         * InsightOut
         * @description What the week or month looked like: the facts, and a summary of them in the user's
         *     language (``message`` from the AI, or ``message_code`` + ``message_params`` worded by the
         *     client when no AI was used).
         */
        InsightOut: {
            period: components["schemas"]["Period"];
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            status: components["schemas"]["RunStatus"];
            /** Mode */
            mode: string | null;
            /** Reason */
            reason: string | null;
            /** Message */
            message: string | null;
            /** Message Code */
            message_code: string | null;
            /** Message Params */
            message_params: {
                [key: string]: unknown;
            };
            /** Facts */
            facts: {
                [key: string]: unknown;
            };
            /** Cached */
            cached: boolean;
        };
        /**
         * IouDirection
         * @enum {string}
         */
        IouDirection: "lent" | "borrowed";
        /** IouIn */
        IouIn: {
            /**
             * Counterparty
             * @description Who the money was lent to or borrowed from
             */
            counterparty: string;
            direction: components["schemas"]["IouDirection"];
            /**
             * Amount Minor
             * @description In the base currency's minor unit
             */
            amount_minor: number;
            /**
             * Date
             * @description When it was lent (default today)
             */
            date?: string | null;
            /**
             * Due On
             * @description When it should be paid back
             */
            due_on?: string | null;
            /** Note */
            note?: string | null;
        };
        /** IouOut */
        IouOut: {
            /**
             * Counterparty
             * @description Who the money was lent to or borrowed from
             */
            counterparty: string;
            direction: components["schemas"]["IouDirection"];
            /**
             * Amount Minor
             * @description In the base currency's minor unit
             */
            amount_minor: number;
            /**
             * Date
             * Format: date
             */
            date: string;
            /**
             * Due On
             * @description When it should be paid back
             */
            due_on?: string | null;
            /** Note */
            note?: string | null;
            /** Id */
            id: string;
            /** Currency */
            currency: string;
            /** Counterparty Key */
            counterparty_key: string;
            /** Settlements */
            settlements: components["schemas"]["SettlementOut"][];
            /**
             * Settled Minor
             * @description Paid back so far
             */
            settled_minor: number;
            /**
             * Outstanding Minor
             * @description Still to be paid back
             */
            outstanding_minor: number;
            /**
             * Settled On
             * @description The day it was paid back in full
             */
            settled_on: string | null;
            /** Revision No */
            revision_no: number;
        };
        /**
         * IouPatch
         * @description Only what is sent changes (``null`` clears the due date or note), plus the revision that
         *     was edited: if the loan has moved on since (a payment came in), the answer is 409.
         */
        IouPatch: {
            /** Counterparty */
            counterparty?: string | null;
            direction?: components["schemas"]["IouDirection"] | null;
            /** Amount Minor */
            amount_minor?: number | null;
            /** Date */
            date?: string | null;
            /** Due On */
            due_on?: string | null;
            /** Note */
            note?: string | null;
            /** Revision No */
            revision_no: number;
        };
        /**
         * IouState
         * @enum {string}
         */
        IouState: "open" | "settled" | "all";
        /** IouSummary */
        IouSummary: {
            /** Currency */
            currency: string;
            /** Owed To Me Minor */
            owed_to_me_minor: number;
            /** I Owe Minor */
            i_owe_minor: number;
            /**
             * People
             * @description People with open loans first (soonest due first), then the settled ones
             */
            people: components["schemas"]["PersonBalance"][];
        };
        /**
         * Item
         * @description A row: either the user's own text (``title``) or a message ``code`` + ``params`` the
         *     client translates.
         */
        Item: {
            /** Title */
            title?: string | null;
            /** Code */
            code?: string | null;
            /** Params */
            params?: {
                [key: string]: unknown;
            };
            /** At */
            at?: string | null;
        };
        /** Items */
        Items: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            kind: "list";
            /** Items */
            items: components["schemas"]["Item"][];
        };
        /**
         * Kpi
         * @description One figure for the period, with the previous period's for a trend.
         */
        Kpi: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            kind: "kpi";
            /** Value */
            value: number;
            /** Previous */
            previous?: number | null;
            /**
             * Format
             * @default number
             * @enum {string}
             */
            format: "number" | "currency";
            /** Currency */
            currency?: string | null;
        };
        /** LaborAdminProjectOut */
        LaborAdminProjectOut: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Kind */
            kind: string | null;
            /** Description */
            description: string | null;
            /** Icon */
            icon: string | null;
            /**
             * Started On
             * Format: date
             */
            started_on: string;
            /** Notes */
            notes: string | null;
            status: components["schemas"]["ProjectStatus"];
            /** Closed At */
            closed_at: string | null;
            /** Currency */
            currency: string;
            rates: components["schemas"]["app__modules__labor__schemas__RatesOut"];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Owner Id */
            owner_id: string;
            /** Owner Name */
            owner_name: string;
        };
        /** LaborAuditOut */
        LaborAuditOut: {
            /** Id */
            id: string;
            /**
             * At
             * Format: date-time
             */
            at: string;
            /** Actor Name */
            actor_name: string;
            /** Actor Role */
            actor_role: string;
            /** Project Id */
            project_id: string | null;
            /** Entity */
            entity: string;
            /** Entity Id */
            entity_id: string;
            /** Action */
            action: string;
            /** Changes */
            changes: components["schemas"]["LaborChangeOut"][];
            /** Note */
            note: string | null;
            /**
             * Labels
             * @description Words for the record ids a change holds (a worker's name and number)
             */
            labels?: {
                [key: string]: string;
            };
        };
        /** LaborChangeOut */
        LaborChangeOut: {
            /** Field */
            field: string;
            /** Before */
            before: unknown;
            /** After */
            after: unknown;
        };
        /** LaborDayMarkOut */
        LaborDayMarkOut: {
            /** Worker Id */
            worker_id: string;
            status: components["schemas"]["AttendanceStatus"];
            /** Units */
            units: number;
            /**
             * Rate Minor
             * @description The wage it was recorded at
             */
            rate_minor: number;
            /** Amount Minor */
            amount_minor: number;
            /** Note */
            note: string | null;
            /**
             * Day
             * Format: date
             */
            day: string;
        };
        /** LaborDayOut */
        LaborDayOut: {
            /**
             * Day
             * Format: date
             */
            day: string;
            /** Workers */
            workers: components["schemas"]["LaborWorkerOut"][];
            /** Marks */
            marks: components["schemas"]["LaborMarkOut"][];
            /**
             * Counts
             * @description full, half, absent and unmarked
             */
            counts: {
                [key: string]: number;
            };
            /**
             * Total Minor
             * @description What the day's marks earned
             */
            total_minor: number;
        };
        /** LaborMarkOut */
        LaborMarkOut: {
            /** Worker Id */
            worker_id: string;
            status: components["schemas"]["AttendanceStatus"];
            /** Units */
            units: number;
            /**
             * Rate Minor
             * @description The wage it was recorded at
             */
            rate_minor: number;
            /** Amount Minor */
            amount_minor: number;
            /** Note */
            note: string | null;
        };
        /**
         * LaborOptions
         * @description What the forms offer and check (data/labor.yaml).
         */
        LaborOptions: {
            /** Kinds */
            kinds: string[];
            /** Genders */
            genders: string[];
            /** Methods */
            methods: string[];
            /** Units */
            units: {
                [key: string]: number;
            };
            /** Max Daily Minor */
            max_daily_minor: number;
            /** Photo Max Bytes */
            photo_max_bytes: number;
            /** Id Max Bytes */
            id_max_bytes: number;
            /** Photo Side Px */
            photo_side_px: number;
            /** Id Side Px */
            id_side_px: number;
            /** Max Report Days */
            max_report_days: number;
        };
        /** LaborOwnerOut */
        LaborOwnerOut: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Email */
            email: string;
            /** Active */
            active: boolean;
            /** Open Projects */
            open_projects: number;
            /** Projects */
            projects: number;
            /** Workers */
            workers: number;
        };
        /** LaborPaymentOut */
        LaborPaymentOut: {
            /** Id */
            id: string;
            /** Worker Id */
            worker_id: string;
            /**
             * Day
             * Format: date
             */
            day: string;
            /** Amount Minor */
            amount_minor: number;
            method: components["schemas"]["PaymentMethod"] | null;
            /** Reference */
            reference: string | null;
            /** Note */
            note: string | null;
            /** Voided At */
            voided_at: string | null;
            /** Void Reason */
            void_reason: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** LaborPeriodOut */
        LaborPeriodOut: {
            /** Full */
            full: number;
            /** Half */
            half: number;
            /** Absent */
            absent: number;
            /** Days */
            days: number;
            /** Earned Minor */
            earned_minor: number;
            /** Paid Minor */
            paid_minor: number;
            /** Owed Minor */
            owed_minor: number;
            /**
             * Start
             * Format: date
             */
            start: string;
        };
        /** LaborProjectOut */
        LaborProjectOut: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Kind */
            kind: string | null;
            /** Description */
            description: string | null;
            /** Icon */
            icon: string | null;
            /**
             * Started On
             * Format: date
             */
            started_on: string;
            /** Notes */
            notes: string | null;
            status: components["schemas"]["ProjectStatus"];
            /** Closed At */
            closed_at: string | null;
            /** Currency */
            currency: string;
            rates: components["schemas"]["app__modules__labor__schemas__RatesOut"];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** LaborReportOut */
        LaborReportOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Grouping */
            grouping: string;
            /** Periods */
            periods: components["schemas"]["LaborPeriodOut"][];
            /** Workers */
            workers: components["schemas"]["LaborWorkerTotalsOut"][];
            total: components["schemas"]["LaborTotalsOut"];
        };
        /** LaborTotalsOut */
        LaborTotalsOut: {
            /** Full */
            full: number;
            /** Half */
            half: number;
            /** Absent */
            absent: number;
            /** Days */
            days: number;
            /** Earned Minor */
            earned_minor: number;
            /** Paid Minor */
            paid_minor: number;
            /** Owed Minor */
            owed_minor: number;
        };
        /** LaborWageOut */
        LaborWageOut: {
            /** From Minor */
            from_minor: number | null;
            /** To Minor */
            to_minor: number;
            /**
             * Effective On
             * Format: date
             */
            effective_on: string;
            /** Reason */
            reason: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /**
         * LaborWorkerHistoryOut
         * @description A worker's days and payments between two days, newest first, and what they add up to.
         */
        LaborWorkerHistoryOut: {
            worker: components["schemas"]["LaborWorkerOut"];
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Days */
            days: components["schemas"]["LaborDayMarkOut"][];
            /**
             * Payments
             * @description Voided ones too, marked
             */
            payments: components["schemas"]["LaborPaymentOut"][];
            /** Earned Minor */
            earned_minor: number;
            /**
             * Paid Minor
             * @description Voided payments left out
             */
            paid_minor: number;
        };
        /** LaborWorkerOut */
        LaborWorkerOut: {
            /** Id */
            id: string;
            /** Project Id */
            project_id: string;
            /** Name */
            name: string;
            /** Code */
            code: string;
            gender: components["schemas"]["Gender"] | null;
            /** Phone */
            phone: string | null;
            /** Daily Wage Minor */
            daily_wage_minor: number;
            /** Active */
            active: boolean;
            /** Notes */
            notes: string | null;
            /** Has Photo */
            has_photo: boolean;
            /** Has Id Card */
            has_id_card: boolean;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** LaborWorkerTotalsOut */
        LaborWorkerTotalsOut: {
            /** Full */
            full: number;
            /** Half */
            half: number;
            /** Absent */
            absent: number;
            /** Days */
            days: number;
            /** Earned Minor */
            earned_minor: number;
            /** Paid Minor */
            paid_minor: number;
            /** Owed Minor */
            owed_minor: number;
            /** Worker Id */
            worker_id: string;
            /** Code */
            code: string;
            /** Name */
            name: string;
            /**
             * Earned To Date Minor
             * @description Earned on every day up to the end day
             */
            earned_to_date_minor: number;
            /**
             * Paid To Date Minor
             * @description Paid (not voided) on every day up to the end day
             */
            paid_to_date_minor: number;
            /**
             * Owed To Date Minor
             * @description Earned less paid, up to the end day
             */
            owed_to_date_minor: number;
        };
        /** LastPrice */
        LastPrice: {
            /** Unit Price Minor */
            unit_price_minor: number;
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Merchant */
            merchant: string | null;
        };
        /**
         * Locale
         * @description UI languages the platform supports (ADR-0009).
         * @enum {string}
         */
        Locale: "en" | "ta" | "hi";
        /** LoginIn */
        LoginIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
        };
        /** MarkIn */
        MarkIn: {
            /** Worker Id */
            worker_id: string;
            status: components["schemas"]["AttendanceStatus"];
            /** Note */
            note?: string | null;
            /**
             * Expected
             * @description The mark the sender last saw (a tap kept offline and sent later): one changed since to something else is refused (LABOR_MARK_CHANGED), never overwritten
             */
            expected?: ("full" | "half" | "absent" | "unmarked") | null;
        };
        /** MarkPaidIn */
        MarkPaidIn: {
            /**
             * Due On
             * Format: date
             * @description The due date paid: the next one, or one before it
             */
            due_on: string;
            /**
             * Amount Minor
             * @description Default: the usual amount
             */
            amount_minor?: number | null;
            /**
             * Date
             * @description When it was paid (default today)
             */
            date?: string | null;
        };
        /** MarksIn */
        MarksIn: {
            /** Marks */
            marks: components["schemas"]["MarkIn"][];
        };
        /**
         * MarksReadOut
         * @description What the mark-attendance skill read, as a draft for the page; never saved.
         */
        MarksReadOut: {
            /** Status */
            status: string;
            /** Mode */
            mode: string | null;
            /** Reason */
            reason: string | null;
            /**
             * Message
             * @description Agent mode: its sentence
             */
            message: string | null;
            /**
             * Message Code
             * @description Static mode: worded on the app
             */
            message_code: string | null;
            /** Message Params */
            message_params: {
                [key: string]: unknown;
            };
            draft: components["schemas"]["AttendanceDraftIn"] | null;
        };
        /** MerchantPrices */
        MerchantPrices: {
            /** Merchant */
            merchant: string | null;
            /** Count */
            count: number;
            /** Min Minor */
            min_minor: number;
            /** Avg Minor */
            avg_minor: number;
            /** Last Minor */
            last_minor: number;
        };
        /** MerchantShare */
        MerchantShare: {
            /** Amount Minor */
            amount_minor: number;
            /** Count */
            count: number;
            /** Share Pct */
            share_pct: number;
            /** Merchant */
            merchant: string;
        };
        /**
         * Metric
         * @enum {string}
         */
        Metric: "total" | "count" | "average" | "largest";
        /** ModuleGrantIn */
        ModuleGrantIn: {
            /** Granted */
            granted: boolean;
        };
        /**
         * ModuleName
         * @description A module as the user sees it on screen, so agents and static scripts match their words.
         */
        ModuleName: {
            /** Key */
            key: string;
            /** Name */
            name: string;
        };
        /**
         * ModuleStatus
         * @enum {string}
         */
        ModuleStatus: "live" | "beta" | "coming_soon";
        /**
         * ModuleView
         * @description A module as the signed-in user sees it: manifest defaults + admin overrides + own
         *     preferences, already merged.
         */
        ModuleView: {
            /** Key */
            key: string;
            /** Slug */
            slug: string;
            /** Version */
            version: string;
            status: components["schemas"]["ModuleStatus"];
            /** Global Enabled */
            global_enabled: boolean;
            /** Enabled */
            enabled: boolean;
            /** Available */
            available: boolean;
            /** Pinned */
            pinned: boolean;
            /** Position */
            position: number;
            /** Notify Requested */
            notify_requested: boolean;
            /** Has Settings */
            has_settings: boolean;
            stat: components["schemas"]["TileStat"] | null;
        };
        /** Month */
        Month: {
            /**
             * Spent Minor
             * @default 0
             */
            spent_minor: number;
            /**
             * Received Minor
             * @default 0
             */
            received_minor: number;
            /**
             * Net Minor
             * @default 0
             */
            net_minor: number;
            /**
             * Count
             * @default 0
             */
            count: number;
            /** Month */
            month: string;
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Savings Rate Pct */
            savings_rate_pct?: number | null;
            /**
             * Cumulative Net Minor
             * @default 0
             */
            cumulative_net_minor: number;
        };
        /** MonthlyOut */
        MonthlyOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            /** Months */
            months: components["schemas"]["Month"][];
        };
        /**
         * MonthlyReportOut
         * @description A month on one page: what came in and went out against the month before, where it went,
         *     and the biggest expenses. A month under way counts up to today, against the same days.
         */
        MonthlyReportOut: {
            /** Month */
            month: string;
            summary: components["schemas"]["app__modules__expenses__features__analytics__schemas__SummaryOut"];
            /**
             * Categories
             * @description Money spent, by category
             */
            categories: components["schemas"]["ReportCategory"][];
            /**
             * Income
             * @description Money received, by category
             */
            income: components["schemas"]["CategoryShare"][];
            /** Merchants */
            merchants: components["schemas"]["MerchantShare"][];
            /** People */
            people: components["schemas"]["PersonShare"][];
            /**
             * Days
             * @description Money spent each day
             */
            days: components["schemas"]["DayAmount"][];
            /**
             * Largest
             * @description The biggest expenses, biggest first
             */
            largest: components["schemas"]["EntryOut"][];
        };
        /** NetOut */
        NetOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            /** Months */
            months: components["schemas"]["Month"][];
            total: components["schemas"]["Totals"];
            /** Savings Rate Pct */
            savings_rate_pct: number | null;
        };
        /** NotificationOut */
        NotificationOut: {
            /** Id */
            id: string;
            /** Type */
            type: string;
            /** Params */
            params: {
                [key: string]: unknown;
            };
            /** Read */
            read: boolean;
            /**
             * At
             * Format: date-time
             */
            at: string;
        };
        /**
         * OneTimePasswordOut
         * @description Shown once and never stored in the clear: give it to the user, who must change it.
         */
        OneTimePasswordOut: {
            /** One Time Password */
            one_time_password: string;
        };
        /** OrderIn */
        OrderIn: {
            /**
             * Keys
             * @description Module keys, first to last
             */
            keys: string[];
        };
        /** OtherProductIn */
        OtherProductIn: {
            /** Product Id */
            product_id: string;
        };
        /** OverviewOut */
        OverviewOut: {
            /**
             * Day
             * Format: date
             */
            day: string;
            /** Open Projects */
            open_projects: number;
            /** Workers */
            workers: number;
            /** Today Minor */
            today_minor: number;
            /** Owed Minor */
            owed_minor: number;
            /** Projects */
            projects: components["schemas"]["OverviewProject"][];
            /** Recent */
            recent: components["schemas"]["LaborAuditOut"][];
        };
        /** OverviewProject */
        OverviewProject: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Icon */
            icon: string | null;
            /** Workers */
            workers: number;
            /** Counts */
            counts: {
                [key: string]: number;
            };
            /** Today Minor */
            today_minor: number;
            /** Owed Minor */
            owed_minor: number;
        };
        /** Page[ActivityOut] */
        Page_ActivityOut_: {
            /** Items */
            items: components["schemas"]["ActivityOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[AdminEntryOut] */
        Page_AdminEntryOut_: {
            /** Items */
            items: components["schemas"]["AdminEntryOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[AdminUserOut] */
        Page_AdminUserOut_: {
            /** Items */
            items: components["schemas"]["AdminUserOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[AgentView] */
        Page_AgentView_: {
            /** Items */
            items: components["schemas"]["AgentView"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[AuditOut] */
        Page_AuditOut_: {
            /** Items */
            items: components["schemas"]["AuditOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[BudgetOut] */
        Page_BudgetOut_: {
            /** Items */
            items: components["schemas"]["BudgetOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[CategoryOut] */
        Page_CategoryOut_: {
            /** Items */
            items: components["schemas"]["CategoryOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[EntryOut] */
        Page_EntryOut_: {
            /** Items */
            items: components["schemas"]["EntryOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[GoalOut] */
        Page_GoalOut_: {
            /** Items */
            items: components["schemas"]["GoalOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[IouOut] */
        Page_IouOut_: {
            /** Items */
            items: components["schemas"]["IouOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[LaborAdminProjectOut] */
        Page_LaborAdminProjectOut_: {
            /** Items */
            items: components["schemas"]["LaborAdminProjectOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[LaborAuditOut] */
        Page_LaborAuditOut_: {
            /** Items */
            items: components["schemas"]["LaborAuditOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[LaborPaymentOut] */
        Page_LaborPaymentOut_: {
            /** Items */
            items: components["schemas"]["LaborPaymentOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[LaborProjectOut] */
        Page_LaborProjectOut_: {
            /** Items */
            items: components["schemas"]["LaborProjectOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[LaborWorkerOut] */
        Page_LaborWorkerOut_: {
            /** Items */
            items: components["schemas"]["LaborWorkerOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[ModuleView] */
        Page_ModuleView_: {
            /** Items */
            items: components["schemas"]["ModuleView"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[NotificationOut] */
        Page_NotificationOut_: {
            /** Items */
            items: components["schemas"]["NotificationOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[ProductSummary] */
        Page_ProductSummary_: {
            /** Items */
            items: components["schemas"]["ProductSummary"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[ReceiptsItemOut] */
        Page_ReceiptsItemOut_: {
            /** Items */
            items: components["schemas"]["ReceiptsItemOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[ReminderOut] */
        Page_ReminderOut_: {
            /** Items */
            items: components["schemas"]["ReminderOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[RevisionOut] */
        Page_RevisionOut_: {
            /** Items */
            items: components["schemas"]["RevisionOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[RuleOut] */
        Page_RuleOut_: {
            /** Items */
            items: components["schemas"]["RuleOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /** Page[SessionOut] */
        Page_SessionOut_: {
            /** Items */
            items: components["schemas"]["SessionOut"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total */
            total: number;
            /** Has Next */
            has_next: boolean;
        };
        /**
         * PasswordChangeIn
         * @description An account without a password (Google only) sets its first one with a fresh Google
         *     sign-in instead of the current password, plus a code when two-step sign-in is on.
         */
        PasswordChangeIn: {
            /** Current Password */
            current_password?: string | null;
            /** New Password */
            new_password: string;
            /** Google Id Token */
            google_id_token?: string | null;
            /** Code */
            code?: string | null;
        };
        /** PasswordPolicyOut */
        PasswordPolicyOut: {
            /** Min Length */
            min_length: number;
            /** Max Length */
            max_length: number;
            /** Min Classes */
            min_classes: number;
        };
        /** PaymentIn */
        PaymentIn: {
            /** Worker Id */
            worker_id: string;
            /** Amount Minor */
            amount_minor: number;
            /**
             * Day
             * @description Default today
             */
            day?: string | null;
            method?: components["schemas"]["PaymentMethod"] | null;
            /** Reference */
            reference?: string | null;
            /** Note */
            note?: string | null;
        };
        /**
         * PaymentMethod
         * @enum {string}
         */
        PaymentMethod: "cash" | "upi" | "bank" | "other";
        /**
         * PaymentMode
         * @enum {string}
         */
        PaymentMode: "cash" | "upi" | "card" | "bank" | "wallet" | "other";
        /**
         * Period
         * @enum {string}
         */
        Period: "week" | "month";
        /**
         * PersonBalance
         * @description Where the user stands with one person, over their loans in the base currency.
         */
        PersonBalance: {
            /**
             * Name
             * @description As last written
             */
            name: string;
            /**
             * Key
             * @description The name as compared: the `person` filter of the list
             */
            key: string;
            /** Owed To Me Minor */
            owed_to_me_minor: number;
            /** I Owe Minor */
            i_owe_minor: number;
            /**
             * Net Minor
             * @description Owed to me less what I owe; negative when I owe more
             */
            net_minor: number;
            /**
             * Open
             * @description Loans with them not yet paid back in full
             */
            open: number;
            /**
             * Next Due On
             * @description The soonest due date of those
             */
            next_due_on: string | null;
            /**
             * Overdue
             * @description One of those was due before today
             */
            overdue: boolean;
        };
        /** PersonShare */
        PersonShare: {
            /** Amount Minor */
            amount_minor: number;
            /** Count */
            count: number;
            /** Share Pct */
            share_pct: number;
            /** Name */
            name: string | null;
        };
        /** Point */
        Point: {
            /**
             * Day
             * Format: date
             */
            day: string;
            /** Value */
            value: number;
        };
        /** PreferencesIn */
        PreferencesIn: {
            /** Enabled */
            enabled?: boolean | null;
            /** Pinned */
            pinned?: boolean | null;
        };
        /** PreviewOut */
        PreviewOut: {
            /**
             * Fingerprint
             * @description The file's SHA-256: an import of it adds each row once
             */
            fingerprint: string;
            /**
             * Columns
             * @description The header row's cells
             */
            columns: string[];
            /** @description As given, or as guessed */
            mapping: components["schemas"]["ColumnMapping"];
            /** Date Formats */
            date_formats: components["schemas"]["DateChoice"][];
            /**
             * Rows
             * @description The first rows, as they would be saved
             */
            rows: components["schemas"]["ImportRow"][];
            /**
             * Problems
             * @description The first rows a problem stops
             */
            problems: components["schemas"]["ImportRow"][];
            /**
             * Unknown Categories
             * @description Categories named in the file that aren't the user's (filed under other)
             */
            unknown_categories: string[];
            /** Total */
            total: number;
            /**
             * Ready
             * @description Rows the import would add
             */
            ready: number;
            /** Duplicates */
            duplicates: number;
            /** With Problems */
            with_problems: number;
        };
        /** PriceStats */
        PriceStats: {
            /** Count */
            count: number;
            /** Min Minor */
            min_minor: number;
            /** Max Minor */
            max_minor: number;
            /** Avg Minor */
            avg_minor: number;
            /** Last Minor */
            last_minor: number;
            /** Previous Minor */
            previous_minor: number | null;
            /** Change Pct */
            change_pct: number | null;
        };
        /**
         * ProblemCode
         * @enum {string}
         */
        ProblemCode: "missing_date" | "bad_date" | "missing_title" | "missing_amount" | "bad_amount" | "currency" | "invalid";
        /** ProductDetail */
        ProductDetail: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Aliases */
            aliases: string[];
            /** Dimension */
            dimension: string;
            /** Price Unit */
            price_unit: string;
            /** Alert Above Minor */
            alert_above_minor: number | null;
            /** Apart */
            apart: string[];
            /** Currency */
            currency: string;
            /** Purchases */
            purchases: components["schemas"]["Purchase"][];
            stats: components["schemas"]["PriceStats"] | null;
            /** Merchants */
            merchants: components["schemas"]["MerchantPrices"][];
            /** Cheapest */
            cheapest: string | null;
        };
        /** ProductOut */
        ProductOut: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Aliases */
            aliases: string[];
            /** Dimension */
            dimension: string;
            /** Price Unit */
            price_unit: string;
            /** Alert Above Minor */
            alert_above_minor: number | null;
            /** Apart */
            apart: string[];
        };
        /**
         * ProductPatch
         * @description Only what is sent changes; ``alert_above_minor: null`` turns the alert off.
         */
        ProductPatch: {
            /** Name */
            name?: string | null;
            /** Aliases */
            aliases?: string[] | null;
            /**
             * Price Unit
             * @description A code from GET /units, of the product's dimension
             */
            price_unit?: string | null;
            /**
             * Alert Above Minor
             * @description Per price_unit, in minor units
             */
            alert_above_minor?: number | null;
        };
        /**
         * ProductSummary
         * @description A product with how its price is going, for the list.
         */
        ProductSummary: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Aliases */
            aliases: string[];
            /** Dimension */
            dimension: string;
            /** Price Unit */
            price_unit: string;
            /** Alert Above Minor */
            alert_above_minor: number | null;
            /** Apart */
            apart: string[];
            /** Currency */
            currency: string;
            /** Purchases */
            purchases: number;
            last: components["schemas"]["LastPrice"] | null;
            /** Change Pct */
            change_pct: number | null;
            /** Trend */
            trend: number[];
            /** Cheapest */
            cheapest: string | null;
        };
        /** ProjectIn */
        ProjectIn: {
            /** Name */
            name: string;
            /** Kind */
            kind?: string | null;
            /** Description */
            description?: string | null;
            /** Icon */
            icon?: string | null;
            /**
             * Started On
             * @description Default today
             */
            started_on?: string | null;
            /** Notes */
            notes?: string | null;
        };
        /**
         * ProjectStatus
         * @enum {string}
         */
        ProjectStatus: "open" | "closed";
        /**
         * Proposal
         * @description A write the agent prepared; nothing happens until the user confirms it.
         */
        Proposal: {
            /** Id */
            id: string;
            /** Tool */
            tool: string;
            /** Arguments */
            arguments: {
                [key: string]: unknown;
            };
            /** Summary */
            summary: string | null;
            /** Summary Code */
            summary_code: string | null;
            /** Summary Params */
            summary_params: {
                [key: string]: unknown;
            };
            /** @default pending */
            status: components["schemas"]["ProposalStatus"];
            /**
             * Expires At
             * Format: date-time
             */
            expires_at: string;
            /** Result */
            result: unknown;
            /** Error Code */
            error_code: string | null;
        };
        /**
         * ProposalStatus
         * @enum {string}
         */
        ProposalStatus: "pending" | "confirmed" | "rejected" | "failed";
        /** Purchase */
        Purchase: {
            /** Entry Id */
            entry_id: string;
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Merchant */
            merchant: string | null;
            /** Quantity */
            quantity: number | null;
            /** Unit */
            unit: string | null;
            /** Amount Minor */
            amount_minor: number;
            /** Unit Price Minor */
            unit_price_minor: number | null;
        };
        /** PushKeys */
        PushKeys: {
            /** P256Dh */
            p256dh: string;
            /** Auth */
            auth: string;
        };
        /** PushOut */
        PushOut: {
            /** Available */
            available: boolean;
            /** Public Key */
            public_key: string | null;
            /** Devices */
            devices: number;
        };
        /** @example 5eb7cf5a86d9755df3a6c593 */
        PydanticObjectId: string;
        /** QueryResult */
        QueryResult: {
            metric: components["schemas"]["Metric"];
            group_by: components["schemas"]["GroupBy"];
            /** Currency */
            currency: string;
            /**
             * Money
             * @description value is an amount in minor units (else a count)
             */
            money: boolean;
            /** Rows */
            rows: components["schemas"]["QueryRow"][];
        };
        /** QueryRow */
        QueryRow: {
            /**
             * Key
             * @description The group (None: not said, or no grouping)
             */
            key: string | null;
            /**
             * Value
             * @description The metric: minor units for money, else a count
             */
            value: number;
            /**
             * Count
             * @description Entries in the group
             */
            count: number;
        };
        /** RatesIn */
        RatesIn: {
            /**
             * By Gender
             * @default false
             */
            by_gender: boolean;
            /**
             * Default Minor
             * @description In the currency's minor unit
             * @default 0
             */
            default_minor: number;
            /**
             * Female Minor
             * @description In the currency's minor unit
             * @default 0
             */
            female_minor: number;
            /**
             * Male Minor
             * @description In the currency's minor unit
             * @default 0
             */
            male_minor: number;
            /** Note */
            note?: string | null;
        };
        /** ReadMarksIn */
        ReadMarksIn: {
            /** Text */
            text: string;
            /**
             * Input Type
             * @default text
             * @enum {string}
             */
            input_type: "text" | "speech";
            /**
             * Locale
             * @description en, ta, hi
             */
            locale?: string | null;
        };
        /** ReadinessStatus */
        ReadinessStatus: {
            /**
             * Status
             * @constant
             */
            status: "ready";
            /** Checks */
            checks: {
                [key: string]: "ok";
            };
        };
        /**
         * ReceiptsItemIn
         * @description A receipt as the form sends it: everything, each time (a change replaces the record).
         */
        ReceiptsItemIn: {
            /**
             * Text
             * @description What was bought
             */
            text: string;
            /**
             * Shop
             * @description Where it was bought
             */
            shop?: string | null;
            /**
             * Bought On
             * @description Default today; never later
             */
            bought_on?: string | null;
            /**
             * Amount Minor
             * @description In the base currency's minor unit
             */
            amount_minor?: number | null;
            /**
             * Bill Number
             * @description The bill's or invoice's number
             */
            bill_number?: string | null;
            /**
             * Serial Number
             * @description The thing's serial number or IMEI, for a warranty claim
             */
            serial_number?: string | null;
            /**
             * Warranty Ends On
             * @description The warranty's last day; none for no warranty
             */
            warranty_ends_on?: string | null;
            /**
             * Remind Days Before
             * @description Days before the warranty ends to remind (default from the module's data)
             */
            remind_days_before?: number | null;
            /**
             * Note
             * @description Anything else to keep
             */
            note?: string | null;
        };
        /** ReceiptsItemOut */
        ReceiptsItemOut: {
            /** Id */
            id: string;
            /** Text */
            text: string;
            /** Shop */
            shop: string | null;
            /**
             * Bought On
             * Format: date
             */
            bought_on: string;
            /** Amount Minor */
            amount_minor: number | null;
            /** Currency */
            currency: string;
            /** Bill Number */
            bill_number: string | null;
            /** Serial Number */
            serial_number: string | null;
            /** Warranty Ends On */
            warranty_ends_on: string | null;
            /** Remind Days Before */
            remind_days_before: number;
            /** @description Where the warranty stands today */
            warranty: components["schemas"]["WarrantyStatus"];
            /** Note */
            note: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /**
         * ReceiptsOptions
         * @description What the form offers and starts with (data/warranty.yaml).
         */
        ReceiptsOptions: {
            /** Remind Days Before */
            remind_days_before: number;
            /** Max Remind Days */
            max_remind_days: number;
            /** Max Months */
            max_months: number;
            /** Quick Months */
            quick_months: number[];
        };
        /**
         * RecoveryCodesOut
         * @description Shown this once: each works one time in place of a code.
         */
        RecoveryCodesOut: {
            /** Recovery Codes */
            recovery_codes: string[];
        };
        /** RegisterIn */
        RegisterIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Name */
            name: string;
            /** Password */
            password: string;
        };
        /**
         * RegistrationMode
         * @enum {string}
         */
        RegistrationMode: "open" | "allowlist" | "closed";
        /** ReminderOut */
        ReminderOut: {
            /** Id */
            id: string;
            /** Type */
            type: string;
            /**
             * Params
             * @description As its notification carries them
             */
            params: {
                [key: string]: unknown;
            };
            /**
             * Due On
             * Format: date
             */
            due_on: string;
            /**
             * Remind At
             * Format: date-time
             * @description When it is (or was) told
             */
            remind_at: string;
            /** Sent */
            sent: boolean;
            /** Snoozed Until */
            snoozed_until: string | null;
        };
        /** ReportCategory */
        ReportCategory: {
            /** Amount Minor */
            amount_minor: number;
            /** Count */
            count: number;
            /** Share Pct */
            share_pct: number;
            /** Category Id */
            category_id: string;
            /**
             * Previous Minor
             * @description Spent under it in the month before, same days
             */
            previous_minor: number;
            /**
             * Change Pct
             * @description None when nothing was spent then
             */
            change_pct: number | null;
        };
        /** RestoreIn */
        RestoreIn: {
            /** Revision No */
            revision_no: number;
        };
        /**
         * RevisionAction
         * @enum {string}
         */
        RevisionAction: "create" | "update" | "delete" | "undelete" | "restore";
        /** RevisionOut */
        RevisionOut: {
            /** Revision No */
            revision_no: number;
            action: components["schemas"]["RevisionAction"];
            /**
             * Changed At
             * Format: date-time
             */
            changed_at: string;
            /** Source */
            source: string;
            /** Changes */
            changes: components["schemas"]["FieldChange"][];
            /** Snapshot */
            snapshot: {
                [key: string]: unknown;
            };
        };
        /** RevokedOut */
        RevokedOut: {
            /** Sessions */
            sessions: number;
        };
        /**
         * Role
         * @enum {string}
         */
        Role: "admin" | "user";
        /** RuleIn */
        RuleIn: {
            template: components["schemas"]["TemplateIn"];
            cadence: components["schemas"]["CadenceIn"];
            mode: components["schemas"]["RuleMode"];
            /**
             * Remind Days Before
             * @description Days before each due date to remind (bills)
             */
            remind_days_before?: number;
            /**
             * Active
             * @default true
             */
            active: boolean;
            /**
             * Signature
             * @description The suggestion this confirms (GET /recurring/suggestions)
             */
            signature?: string | null;
        };
        /**
         * RuleMode
         * @description What a repeating rule does on each due date.
         * @enum {string}
         */
        RuleMode: "auto_create" | "remind";
        /** RuleOut */
        RuleOut: {
            /** Id */
            id: string;
            template: components["schemas"]["TemplateFields"];
            /** Currency */
            currency: string;
            cadence: components["schemas"]["CadenceFields"];
            /**
             * Next Run
             * Format: date
             * @description The next due date not added yet, or (a bill) not paid
             */
            next_run: string;
            mode: components["schemas"]["RuleMode"];
            /** Remind Days Before */
            remind_days_before: number;
            /** Active */
            active: boolean;
            source: components["schemas"]["RuleSource"];
            /** Signature */
            signature: string | null;
            /**
             * Overdue
             * @description A bill whose due date has passed unpaid
             */
            overdue: boolean;
        };
        /**
         * RulePatch
         * @description Only what is sent changes; the template and cadence are sent whole.
         */
        RulePatch: {
            template?: components["schemas"]["TemplateIn"] | null;
            cadence?: components["schemas"]["CadenceIn"] | null;
            mode?: components["schemas"]["RuleMode"] | null;
            /** Remind Days Before */
            remind_days_before?: number | null;
            /** Active */
            active?: boolean | null;
        };
        /**
         * RuleSource
         * @enum {string}
         */
        RuleSource: "manual" | "detected";
        /** RunContext */
        RunContext: {
            /** Modules */
            modules?: components["schemas"]["ModuleName"][];
            /**
             * Input Type
             * @description How the input was given, when a page asks on purpose; ocr: text read from a photo on the device (limit: AGENT_MAX_OCR_CHARS, for a skill that reads it)
             */
            input_type?: ("text" | "speech" | "sms" | "ocr") | null;
        };
        /** RunIn */
        RunIn: {
            /**
             * Input
             * @description What the user asked (limit: AGENT_MAX_INPUT_CHARS)
             */
            input: string;
            /**
             * Skill
             * @description Use only this skill
             */
            skill?: string | null;
            /** @description Defaults to the user's language */
            locale?: components["schemas"]["Locale"] | null;
            context?: components["schemas"]["RunContext"];
        };
        /** RunOut */
        RunOut: {
            /** Id */
            id: string;
            /** Agent */
            agent: string;
            /** Skill */
            skill: string | null;
            status: components["schemas"]["RunStatus"];
            mode: components["schemas"]["AgentMode"] | null;
            reason: components["schemas"]["Blocker"] | null;
            /** Message */
            message: string | null;
            /** Message Code */
            message_code: string | null;
            /** Message Params */
            message_params: {
                [key: string]: unknown;
            };
            /** Proposals */
            proposals: components["schemas"]["Proposal"][];
            /** Client Actions */
            client_actions: components["schemas"]["ClientAction"][];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /**
         * RunStatus
         * @enum {string}
         */
        RunStatus: "completed" | "unavailable" | "incomplete";
        /** RunningTotal */
        RunningTotal: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Total Minor */
            total_minor: number;
        };
        /** SavedFilterIn */
        SavedFilterIn: {
            /** Name */
            name: string;
            view: components["schemas"]["SavedView"];
        };
        /** SavedFilterOut */
        SavedFilterOut: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            view: components["schemas"]["SavedView"];
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /**
         * SavedFilterPatch
         * @description Only what is sent changes: a new name, or the list's filters as they are now.
         */
        SavedFilterPatch: {
            /** Name */
            name?: string | null;
            view?: components["schemas"]["SavedView"] | null;
        };
        /**
         * SavedView
         * @description The entries list's filters as the user set them: a period by name, or the days a chart
         *     or budget chose (``from``/``to``), and what else narrows the list.
         */
        SavedView: {
            /** @default all */
            show: components["schemas"]["ViewShow"];
            /** @description Default this_month; leave out when giving from/to */
            period?: components["schemas"]["ViewPeriod"] | null;
            /**
             * From
             * @description First day
             */
            from?: string | null;
            /**
             * To
             * @description Last day, inclusive
             */
            to?: string | null;
            /**
             * Q
             * @description In title, merchant or note
             */
            q?: string | null;
            /** Category Id */
            category_id?: string | null;
            /** Tag */
            tag?: string | null;
            /** For Whom */
            for_whom?: string | null;
            /** Merchant */
            merchant?: string | null;
        };
        /** SearchGroup */
        SearchGroup: {
            /** Owner */
            owner: string;
            /** Hits */
            hits: components["schemas"]["SearchHit"][];
        };
        /**
         * SearchHit
         * @description One thing found: the user's own words for it, and what helps tell it apart.
         */
        SearchHit: {
            /**
             * Kind
             * @description What it is; the client names it
             */
            kind: string;
            /** Id */
            id: string;
            /** Title */
            title: string;
            /**
             * Path
             * @description Where it opens within its module, e.g. entries/<id> or ?view=<id>
             */
            path: string;
            /** Amount Minor */
            amount_minor?: number | null;
            /** Currency */
            currency?: string | null;
            /** Date */
            date?: string | null;
        };
        /** SearchOut */
        SearchOut: {
            /** Query */
            query: string;
            /** Groups */
            groups: components["schemas"]["SearchGroup"][];
        };
        /** SentOut */
        SentOut: {
            /** Sent */
            sent: number;
        };
        /**
         * Series
         * @description One value per day of the period.
         */
        Series: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            kind: "series";
            /** Points */
            points: components["schemas"]["Point"][];
            /**
             * Format
             * @default number
             * @enum {string}
             */
            format: "number" | "currency";
            /** Currency */
            currency?: string | null;
        };
        /** SessionOut */
        SessionOut: {
            /** Id */
            id: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Last Used At
             * Format: date-time
             */
            last_used_at: string;
            /**
             * Expires At
             * Format: date-time
             */
            expires_at: string;
            /** User Agent */
            user_agent: string | null;
            /** Ip */
            ip: string | null;
            /** Current */
            current: boolean;
        };
        /** SettlementIn */
        SettlementIn: {
            /**
             * Amount Minor
             * @description Paid back; negative to correct a payment
             */
            amount_minor: number;
            /**
             * Date
             * @description Default today; from the day of the loan to today
             */
            date?: string | null;
            /** Note */
            note?: string | null;
        };
        /** SettlementOut */
        SettlementOut: {
            /** Key */
            key: string;
            /** Amount Minor */
            amount_minor: number;
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Note */
            note: string | null;
        };
        /**
         * Signs
         * @description How an amount column without a kind tells money spent from money received.
         * @enum {string}
         */
        Signs: "expense" | "signed";
        /** SkillView */
        SkillView: {
            /** Name */
            name: string;
            /** Description */
            description: string;
            mode: components["schemas"]["AgentMode"];
            /** Has Static */
            has_static: boolean;
            /** @description For a skill that reads photos: what a photo run would use right now (agent: the photo goes to AI; static: read it on the device); null: it takes no photos or can't run */
            photo_mode?: components["schemas"]["AgentMode"] | null;
        };
        /**
         * SkipReason
         * @enum {string}
         */
        SkipReason: "not_found" | "unchanged" | "kind" | "conflict" | "tags_full";
        /** SnoozeIn */
        SnoozeIn: {
            /**
             * Days
             * @description Days from today; at most REMINDERS_MAX_SNOOZE_DAYS
             */
            days: number;
        };
        /**
         * SortOrder
         * @enum {string}
         */
        SortOrder: "value_desc" | "value_asc" | "key";
        /** Span */
        Span: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
        };
        /** StatusIn */
        StatusIn: {
            /** Note */
            note?: string | null;
        };
        /**
         * SubscriptionIn
         * @description As the browser's `PushSubscription.toJSON()` gives it (``expirationTime`` is ignored).
         */
        SubscriptionIn: {
            /** Endpoint */
            endpoint: string;
            keys: components["schemas"]["PushKeys"];
        };
        /**
         * SuggestionOut
         * @description Something in the entries that looks like it repeats, as a rule for it would start.
         */
        SuggestionOut: {
            /**
             * Signature
             * @description Sent back to confirm it (POST /recurring) or dismiss it
             */
            signature: string;
            template: components["schemas"]["TemplateFields"];
            /** Currency */
            currency: string;
            /** @description Anchored on its next due date, today or later */
            cadence: components["schemas"]["CadenceFields"];
            /**
             * Count
             * @description How many times it was seen at this pace
             */
            count: number;
            /**
             * Last On
             * Format: date
             * @description When it was last seen
             */
            last_on: string;
        };
        /**
         * TemplateFields
         * @description The entry each due date adds, or that marking a bill paid adds.
         */
        TemplateFields: {
            /** @default expense */
            kind: components["schemas"]["EntryKind"];
            /** Title */
            title: string;
            /**
             * Amount Minor
             * @description In the currency's minor unit
             */
            amount_minor: number;
            /** Category Id */
            category_id: string;
            /** Merchant */
            merchant?: string | null;
            payment_mode?: components["schemas"]["PaymentMode"] | null;
            /** For Whom */
            for_whom?: string | null;
            /**
             * Tags
             * @default []
             */
            tags: string[];
            /** Note */
            note?: string | null;
        };
        /** TemplateIn */
        TemplateIn: {
            /** @default expense */
            kind: components["schemas"]["EntryKind"];
            /** Title */
            title: string;
            /**
             * Amount Minor
             * @description In the currency's minor unit
             */
            amount_minor: number;
            /** Category Id */
            category_id: string;
            /** Merchant */
            merchant?: string | null;
            payment_mode?: components["schemas"]["PaymentMode"] | null;
            /** For Whom */
            for_whom?: string | null;
            /**
             * Tags
             * @default []
             */
            tags: string[];
            /** Note */
            note?: string | null;
        };
        /**
         * ThemePreference
         * @enum {string}
         */
        ThemePreference: "light" | "dark" | "system";
        /**
         * TileStat
         * @description A small figure for the module's Welcome tile (e.g. ``₹4,320 this month``).
         *
         *     ``label`` is a key in the module's frontend strings, so the client translates it.
         */
        TileStat: {
            /** Value */
            value: number;
            /**
             * Format
             * @default number
             * @enum {string}
             */
            format: "number" | "currency";
            /** Currency */
            currency?: string | null;
            /** Label */
            label: string;
        };
        /**
         * TokenOut
         * @description Access token for the Authorization header. The refresh token is never in a body:
         *     it travels only in the httpOnly cookie.
         */
        TokenOut: {
            /** Access Token */
            access_token: string;
            /**
             * Token Type
             * @default bearer
             * @constant
             */
            token_type: "bearer";
            /** Expires In */
            expires_in: number;
            user: components["schemas"]["UserOut"];
        };
        /** TopMerchantsOut */
        TopMerchantsOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            kind: components["schemas"]["EntryKind"];
            /** Total Minor */
            total_minor: number;
            /** Items */
            items: components["schemas"]["MerchantShare"][];
        };
        /** TopProduct */
        TopProduct: {
            /** Product Id */
            product_id: string;
            /** Name */
            name: string;
            /** Amount Minor */
            amount_minor: number;
            /** Count */
            count: number;
            /** Price Unit */
            price_unit: string;
            /** Last Unit Price Minor */
            last_unit_price_minor: number | null;
        };
        /** TopProductsOut */
        TopProductsOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            /** Items */
            items: components["schemas"]["TopProduct"][];
        };
        /** Totals */
        Totals: {
            /**
             * Spent Minor
             * @default 0
             */
            spent_minor: number;
            /**
             * Received Minor
             * @default 0
             */
            received_minor: number;
            /**
             * Net Minor
             * @default 0
             */
            net_minor: number;
            /**
             * Count
             * @default 0
             */
            count: number;
        };
        /**
         * TrackIn
         * @description Follow the price of what an entry is called (and every entry with that title).
         */
        TrackIn: {
            /** Title */
            title: string;
            /** Name */
            name?: string | null;
        };
        /**
         * TwoFactorChallengeOut
         * @description Sign-in needs a code too: send it with this token to ``/v1/auth/login/totp``.
         */
        TwoFactorChallengeOut: {
            /**
             * Two Factor Required
             * @default true
             * @constant
             */
            two_factor_required: true;
            /** Challenge Token */
            challenge_token: string;
            /** Expires In */
            expires_in: number;
        };
        /** TwoFactorCodeIn */
        TwoFactorCodeIn: {
            /** Code */
            code: string;
        };
        /**
         * TwoFactorConfirmIn
         * @description Turning it on or off: a code, and the password (or a fresh Google sign-in).
         */
        TwoFactorConfirmIn: {
            /** Password */
            password?: string | null;
            /** Google Id Token */
            google_id_token?: string | null;
            /** Code */
            code: string;
        };
        /** TwoFactorLoginIn */
        TwoFactorLoginIn: {
            /** Challenge Token */
            challenge_token: string;
            /** Code */
            code: string;
        };
        /** TwoFactorOut */
        TwoFactorOut: {
            /** Available */
            available: boolean;
            /** Enabled */
            enabled: boolean;
            /** Enabled At */
            enabled_at: string | null;
            /** Recovery Codes Left */
            recovery_codes_left: number;
        };
        /** TwoFactorSetupOut */
        TwoFactorSetupOut: {
            /** Secret */
            secret: string;
            /** Otpauth Uri */
            otpauth_uri: string;
        };
        /**
         * UiMode
         * @enum {string}
         */
        UiMode: "standard" | "simple";
        /** UnitOut */
        UnitOut: {
            /** Code */
            code: string;
            /** Dimension */
            dimension: string;
            /** Factor */
            factor: number;
        };
        /** Unusual */
        Unusual: {
            /** Entry Id */
            entry_id: string;
            /** Title */
            title: string;
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Category Id */
            category_id: string;
            /** Amount Minor */
            amount_minor: number;
            /** Usual Minor */
            usual_minor: number;
            /** Times Usual */
            times_usual: number;
        };
        /** UsageOut */
        UsageOut: {
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Total Users */
            total_users: number;
            /** Active Users */
            active_users: number;
            /** Signups */
            signups: components["schemas"]["DayCount"][];
            ai: components["schemas"]["AiUsage"];
            /** Errors */
            errors: components["schemas"]["CodeCount"][];
        };
        /** UserOut */
        UserOut: {
            /** Id */
            id: string;
            /** Email */
            email: string;
            /** Name */
            name: string;
            role: components["schemas"]["Role"];
            locale: components["schemas"]["Locale"];
            theme: components["schemas"]["ThemePreference"];
            ui_mode: components["schemas"]["UiMode"];
            /** Base Currency */
            base_currency: string;
            /** Timezone */
            timezone: string;
            /** Ai Consent */
            ai_consent: boolean;
            /** Must Change Password */
            must_change_password: boolean;
            /** Has Password */
            has_password: boolean;
            /** Two Factor */
            two_factor: boolean;
            /** Auth Providers */
            auth_providers: string[];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /**
         * UserUpdate
         * @description Fields a user may change about themselves. Anything else is rejected.
         */
        UserUpdate: {
            /** Name */
            name?: string | null;
            locale?: components["schemas"]["Locale"] | null;
            theme?: components["schemas"]["ThemePreference"] | null;
            ui_mode?: components["schemas"]["UiMode"] | null;
            /** Base Currency */
            base_currency?: string | null;
            /** Timezone */
            timezone?: string | null;
            /** Ai Consent */
            ai_consent?: boolean | null;
        };
        /**
         * ViewPeriod
         * @description Kept by name, so a view of this month shows this month whenever it is opened.
         * @enum {string}
         */
        ViewPeriod: "this_month" | "last_month" | "last_90_days" | "all_time";
        /**
         * ViewShow
         * @enum {string}
         */
        ViewShow: "all" | "expense" | "income" | "deleted";
        /** VoidIn */
        VoidIn: {
            /** Reason */
            reason: string;
        };
        /** WageIn */
        WageIn: {
            /**
             * Daily Wage Minor
             * @description In the currency's minor unit
             */
            daily_wage_minor: number;
            /**
             * Effective On
             * @description Default today
             */
            effective_on?: string | null;
            /** Reason */
            reason?: string | null;
        };
        /**
         * WarrantyStatus
         * @enum {string}
         */
        WarrantyStatus: "none" | "active" | "ending" | "ended";
        /** WeekdayAmount */
        WeekdayAmount: {
            /**
             * Weekday
             * @description 0 = Monday
             */
            weekday: number;
            /** Total Minor */
            total_minor: number;
            /** Average Minor */
            average_minor: number;
        };
        /** WidgetView */
        WidgetView: {
            /** Key */
            key: string;
            /** Owner */
            owner: string;
            /**
             * Kind
             * @enum {string}
             */
            kind: "kpi" | "series" | "list";
            /** Data */
            data: (components["schemas"]["Kpi"] | components["schemas"]["Series"] | components["schemas"]["Items"]) | null;
        };
        /** WorkerIn */
        WorkerIn: {
            /** Name */
            name: string;
            /** Code */
            code?: string | null;
            gender?: components["schemas"]["Gender"] | null;
            /** Phone */
            phone?: string | null;
            /** Notes */
            notes?: string | null;
            /**
             * Daily Wage Minor
             * @description Default: the project's rate (by gender where it uses that)
             */
            daily_wage_minor?: number | null;
        };
        /** SummaryOut */
        app__modules__expenses__features__analytics__schemas__SummaryOut: {
            /**
             * Spent Minor
             * @default 0
             */
            spent_minor: number;
            /**
             * Received Minor
             * @default 0
             */
            received_minor: number;
            /**
             * Net Minor
             * @default 0
             */
            net_minor: number;
            /**
             * Count
             * @default 0
             */
            count: number;
            /**
             * Start
             * Format: date
             */
            start: string;
            /**
             * End
             * Format: date
             */
            end: string;
            /** Currency */
            currency: string;
            /** Days */
            days: number;
            /** Avg Daily Spent Minor */
            avg_daily_spent_minor: number;
            /** Savings Rate Pct */
            savings_rate_pct: number | null;
            previous: components["schemas"]["Span"];
            previous_totals: components["schemas"]["Totals"];
            /** Spent Change Pct */
            spent_change_pct: number | null;
            /** Received Change Pct */
            received_change_pct: number | null;
        };
        /** SummaryOut */
        app__modules__expenses__features__entries__schemas__SummaryOut: {
            /** Totals */
            totals: components["schemas"]["CurrencyTotal"][];
        };
        /** RatesOut */
        app__modules__labor__schemas__RatesOut: {
            /** By Gender */
            by_gender: boolean;
            /** Default Minor */
            default_minor: number;
            /** Female Minor */
            female_minor: number;
            /** Male Minor */
            male_minor: number;
        };
        /** RatesOut */
        app__platform__fx__router__RatesOut: {
            /** Base */
            base: string;
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Rates */
            rates: {
                [key: string]: string;
            };
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    healthz_healthz_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthStatus"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    readyz_readyz_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessStatus"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_config_v1_auth_config_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthConfigOut"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    register_v1_auth_register_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenOut"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    login_v1_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenOut"] | components["schemas"]["TwoFactorChallengeOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    login_totp_v1_auth_login_totp_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TwoFactorLoginIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    refresh_v1_auth_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    logout_v1_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    logout_all_v1_auth_logout_all_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_password_v1_auth_password_change_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordChangeIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    google_sign_in_v1_auth_google_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoogleSignInIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenOut"] | components["schemas"]["TwoFactorChallengeOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_two_factor_v1_auth_totp_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TwoFactorOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    setup_two_factor_v1_auth_totp_setup_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TwoFactorSetupOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    enable_two_factor_v1_auth_totp_enable_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TwoFactorConfirmIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RecoveryCodesOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    disable_two_factor_v1_auth_totp_disable_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TwoFactorConfirmIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    renew_recovery_codes_v1_auth_totp_recovery_codes_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TwoFactorCodeIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RecoveryCodesOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_me_v1_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_me_v1_me_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountDeleteIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_me_v1_me_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    export_my_data_v1_me_export_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Everything, as one JSON file */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_sessions_v1_me_sessions_get: {
        parameters: {
            query?: {
                /** @description e.g. -last_used_at */
                sort?: string | null;
                /** @description Only sessions that can still be used */
                active?: boolean;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_SessionOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    revoke_session_v1_me_sessions__session_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_modules_v1_modules_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["ModuleStatus"] | null;
                /** @description Only (un)pinned modules */
                pinned?: boolean | null;
                /** @description position (default) or key; - = descending */
                sort?: string | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ModuleView_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    reorder_modules_v1_modules_order_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OrderIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_module_v1_modules__key__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ModuleView"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_preferences_v1_modules__key__preferences_patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PreferencesIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ModuleView"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    request_launch_notice_v1_modules__key__interest_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ModuleView"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    cancel_launch_notice_v1_modules__key__interest_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ModuleView"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_settings_schema_v1_modules__key__settings_schema_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_settings_v1_modules__key__settings_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    save_settings_v1_modules__key__settings_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: unknown;
                };
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_agents_v1_agents_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_AgentView_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    run_agent_v1_agents__name__runs_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RunIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    run_agent_on_photo_v1_agents__name__photo_runs_post: {
        parameters: {
            query: {
                skill: string;
                locale?: components["schemas"]["Locale"] | null;
            };
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "image/jpeg": string;
                "image/png": string;
                "image/webp": string;
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unsupported Media Type */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_run_v1_agents_runs__run_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    confirm_proposal_v1_agents_proposals__proposal_id__confirm_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                proposal_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Proposal"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    reject_proposal_v1_agents_proposals__proposal_id__reject_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                proposal_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Proposal"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_dashboard_v1_dashboard_get: {
        parameters: {
            query?: {
                /** @description First day (default: recent) */
                from?: string | null;
                /** @description Last day, inclusive (default: today) */
                to?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_activity_v1_activity_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ActivityOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_notifications_v1_notifications_get: {
        parameters: {
            query?: {
                /** @description true = only unread */
                unread?: boolean | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_NotificationOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_all_v1_notifications_read_all_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_one_v1_notifications__notification_id__read_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                notification_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    remove_one_v1_notifications__notification_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                notification_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_reminders_v1_reminders_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ReminderOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    snooze_v1_reminders__reminder_id__snooze_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                reminder_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SnoozeIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReminderOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    dismiss_v1_reminders__reminder_id__dismiss_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                reminder_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_push_v1_push_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PushOut"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    subscribe_v1_push_subscriptions_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubscriptionIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PushOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    unsubscribe_v1_push_subscriptions_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EndpointIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    send_test_v1_push_test_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SentOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    search_everything_v1_search_get: {
        parameters: {
            query: {
                /** @description What to look for: any case, part of a word */
                q: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SearchOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_rates_v1_fx_rates_get: {
        parameters: {
            query?: {
                base?: string | null;
                date?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__platform__fx__router__RatesOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_all_users_dashboard_v1_admin_dashboard_get: {
        parameters: {
            query?: {
                /** @description First day (default: recent) */
                from?: string | null;
                /** @description Last day, inclusive (default: today) */
                to?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_audit_logs_v1_admin_audit_logs_get: {
        parameters: {
            query?: {
                action?: string | null;
                entity?: string | null;
                actor_id?: components["schemas"]["PydanticObjectId"] | null;
                owner_id?: components["schemas"]["PydanticObjectId"] | null;
                /** @description First day (UTC) */
                from?: string | null;
                /** @description Last day (UTC) */
                to?: string | null;
                page?: number;
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_AuditOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_users_v1_admin_users_get: {
        parameters: {
            query?: {
                /** @description Words in the email or name */
                q?: string | null;
                role?: components["schemas"]["Role"] | null;
                state?: components["schemas"]["AccountState"];
                page?: number;
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_AdminUserOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_user_v1_admin_users_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminUserIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUserCreated"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_user_v1_admin_users__user_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: components["schemas"]["PydanticObjectId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUserDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_user_v1_admin_users__user_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: components["schemas"]["PydanticObjectId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminUserPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUserOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    revoke_user_sessions_v1_admin_users__user_id__revoke_sessions_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: components["schemas"]["PydanticObjectId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RevokedOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    reset_user_password_v1_admin_users__user_id__reset_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: components["schemas"]["PydanticObjectId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OneTimePasswordOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    set_user_module_v1_admin_users__user_id__modules__key__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: components["schemas"]["PydanticObjectId"];
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ModuleGrantIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUserOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_allowed_v1_admin_allowed_emails_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AllowedOut"][];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_allowed_v1_admin_allowed_emails_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AllowedIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AllowedOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    remove_allowed_v1_admin_allowed_emails__email__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                email: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_modules_v1_admin_modules_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminModuleOut"][];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_module_v1_admin_modules__key__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminModulePatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminModuleOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_usage_v1_admin_analytics_usage_get: {
        parameters: {
            query?: {
                from?: string | null;
                to?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsageOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_db_v1_admin_analytics_db_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DbOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_entries_v1_expenses_entries_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
                /** @description e.g. -date,amount_minor */
                sort?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_EntryOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_entry_v1_expenses_entries_post: {
        parameters: {
            query?: never;
            header?: {
                /** @description A unique value per new record (e.g. a UUID); repeat it when retrying. */
                "Idempotency-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EntryIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EntryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    summarise_entries_v1_expenses_entries_summary_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__modules__expenses__features__entries__schemas__SummaryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    entry_facets_v1_expenses_entries_facets_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FacetsOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    check_duplicates_v1_expenses_entries_duplicates_check_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DuplicatesIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DuplicatesOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    bulk_update_v1_expenses_entries_bulk_update_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BulkIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_entry_v1_expenses_entries__entry_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                entry_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EntryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    save_entry_v1_expenses_entries__entry_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                entry_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EntryUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EntryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_entry_v1_expenses_entries__entry_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                entry_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    undelete_entry_v1_expenses_entries__entry_id__undelete_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                entry_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EntryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    entry_history_v1_expenses_entries__entry_id__revisions_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path: {
                entry_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_RevisionOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    restore_entry_v1_expenses_entries__entry_id__restore_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                entry_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RestoreIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EntryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_categories_v1_expenses_categories_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_CategoryOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_category_v1_expenses_categories_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CategoryIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    archive_category_v1_expenses_categories__category_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_category_v1_expenses_categories__category_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CategoryPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_products_v1_expenses_products_get: {
        parameters: {
            query?: {
                /** @description Only the one it claims */
                title?: string | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ProductSummary_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    track_product_v1_expenses_products_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TrackIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_product_v1_expenses_products__product_id__get: {
        parameters: {
            query?: {
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
            };
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    stop_product_v1_expenses_products__product_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_product_v1_expenses_products__product_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProductPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    merge_product_v1_expenses_products__product_id__merge_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OtherProductIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    keep_apart_v1_expenses_products__product_id__apart_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OtherProductIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    summary_v1_expenses_analytics_summary_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__modules__expenses__features__analytics__schemas__SummaryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    by_category_v1_expenses_analytics_by_category_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ByCategoryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    by_person_v1_expenses_analytics_by_person_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ByPersonOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    daily_v1_expenses_analytics_daily_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DailyOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    monthly_v1_expenses_analytics_monthly_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MonthlyOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    net_v1_expenses_analytics_net_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NetOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    top_products_v1_expenses_analytics_top_products_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TopProductsOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    top_merchants_v1_expenses_analytics_top_merchants_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TopMerchantsOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    weekday_heatmap_v1_expenses_analytics_weekday_heatmap_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HeatmapOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    cumulative_v1_expenses_analytics_cumulative_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CumulativeOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    forecast_v1_expenses_analytics_forecast_get: {
        parameters: {
            query?: {
                /** @description A day of the month */
                date?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ForecastOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    anomalies_v1_expenses_analytics_anomalies_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AnomaliesOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_insight_v1_expenses_insights_get: {
        parameters: {
            query?: {
                period?: components["schemas"]["Period"];
                /** @description Any day of it; default today */
                date?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    refresh_insight_v1_expenses_insights_refresh_post: {
        parameters: {
            query?: {
                period?: components["schemas"]["Period"];
                /** @description Any day of it; default today */
                date?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_budgets_v1_expenses_budgets_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_BudgetOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_budget_v1_expenses_budgets_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BudgetIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BudgetOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_budget_v1_expenses_budgets__budget_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                budget_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_budget_v1_expenses_budgets__budget_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                budget_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BudgetPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BudgetOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_goals_v1_expenses_goals_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_GoalOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_goal_v1_expenses_goals_post: {
        parameters: {
            query?: never;
            header?: {
                /** @description A unique value per new record (e.g. a UUID); repeat it when retrying. */
                "Idempotency-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoalIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GoalOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_goal_v1_expenses_goals__goal_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                goal_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_goal_v1_expenses_goals__goal_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                goal_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoalPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GoalOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    undelete_goal_v1_expenses_goals__goal_id__undelete_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                goal_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GoalOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    contribute_v1_expenses_goals__goal_id__contributions_post: {
        parameters: {
            query?: never;
            header?: {
                /** @description A unique value per new record (e.g. a UUID); repeat it when retrying. */
                "Idempotency-Key"?: string | null;
            };
            path: {
                goal_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContributionIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GoalOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_ious_v1_expenses_ious_get: {
        parameters: {
            query?: {
                state?: components["schemas"]["IouState"];
                /** @description A person's name (as compared: any case) */
                person?: string | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_IouOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_iou_v1_expenses_ious_post: {
        parameters: {
            query?: never;
            header?: {
                /** @description A unique value per new record (e.g. a UUID); repeat it when retrying. */
                "Idempotency-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IouIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IouOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    summarise_ious_v1_expenses_ious_summary_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IouSummary"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    get_iou_v1_expenses_ious__iou_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                iou_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IouOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_iou_v1_expenses_ious__iou_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                iou_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_iou_v1_expenses_ious__iou_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                iou_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IouPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IouOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    undelete_iou_v1_expenses_ious__iou_id__undelete_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                iou_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IouOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    settle_iou_v1_expenses_ious__iou_id__settlements_post: {
        parameters: {
            query?: never;
            header?: {
                /** @description A unique value per new record (e.g. a UUID); repeat it when retrying. */
                "Idempotency-Key"?: string | null;
            };
            path: {
                iou_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SettlementIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IouOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_rules_v1_expenses_recurring_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_RuleOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_rule_v1_expenses_recurring_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RuleIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RuleOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_suggestions_v1_expenses_recurring_suggestions_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuggestionOut"][];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    dismiss_suggestion_v1_expenses_recurring_suggestions_dismiss_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DismissIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_rule_v1_expenses_recurring__rule_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                rule_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_rule_v1_expenses_recurring__rule_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                rule_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RulePatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RuleOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    mark_paid_v1_expenses_recurring__rule_id__mark_paid_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                rule_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MarkPaidIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EntryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_saved_filters_v1_expenses_saved_filters_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SavedFilterOut"][];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_saved_filter_v1_expenses_saved_filters_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SavedFilterIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SavedFilterOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_saved_filter_v1_expenses_saved_filters__saved_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                saved_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_saved_filter_v1_expenses_saved_filters__saved_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                saved_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SavedFilterPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SavedFilterOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    export_entries_v1_expenses_export_csv_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description UTF-8 CSV, newest first */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": unknown;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    preview_import_v1_expenses_import_preview_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ImportIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PreviewOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    commit_import_v1_expenses_import_commit_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CommitIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CommitOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    monthly_report_v1_expenses_reports_monthly_get: {
        parameters: {
            query?: {
                /** @description YYYY-MM; default this month */
                month?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MonthlyReportOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    monthly_report_csv_v1_expenses_reports_monthly_csv_get: {
        parameters: {
            query?: {
                /** @description YYYY-MM; default this month */
                month?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description UTF-8 CSV: a row per figure */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": unknown;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    query_entries_v1_expenses_query_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExpenseQuery"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QueryResult"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_units_v1_expenses_units_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnitOut"][];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_all_entries_v1_admin_expenses_entries_get: {
        parameters: {
            query?: {
                kind?: components["schemas"]["EntryKind"] | null;
                /** @description First day */
                from?: string | null;
                /** @description Last day, inclusive */
                to?: string | null;
                category_id?: string | null;
                tag?: string | null;
                for_whom?: string | null;
                /** @description Exactly this place */
                merchant?: string | null;
                payment_mode?: components["schemas"]["PaymentMode"] | null;
                /** @description In title, merchant or note */
                q?: string | null;
                /** @description Minor units */
                min_amount?: number | null;
                /** @description Minor units */
                max_amount?: number | null;
                /** @description true = only deleted entries */
                deleted?: boolean;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
                /** @description e.g. -date,amount_minor */
                sort?: string | null;
                /** @description One person's only */
                user_id?: components["schemas"]["PydanticObjectId"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_AdminEntryOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    correct_entry_v1_admin_expenses_entries__entry_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                entry_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminEntryPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminEntryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    labor_options_v1_labor_options_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborOptions"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    labor_overview_v1_labor_overview_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OverviewOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    labor_audit_v1_labor_audit_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
                project_id?: string | null;
                /** @description project, worker ... */
                entity?: string | null;
                entity_id?: string | null;
                action?: string | null;
                /** @description Words in who did it */
                actor?: string | null;
                from?: string | null;
                to?: string | null;
                /** @description An owner's id (admins only) */
                owner?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_LaborAuditOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_projects_v1_labor_projects_get: {
        parameters: {
            query?: {
                state?: components["schemas"]["ProjectStatus"] | null;
                /** @description Words in a name or number */
                q?: string | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_LaborProjectOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_project_v1_labor_projects_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProjectIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborProjectOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_project_v1_labor_projects__project_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborProjectOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_project_v1_labor_projects__project_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProjectIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborProjectOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    close_project_v1_labor_projects__project_id__close_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StatusIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborProjectOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    reopen_project_v1_labor_projects__project_id__reopen_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StatusIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborProjectOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    set_rates_v1_labor_projects__project_id__rates_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RatesIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborProjectOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_workers_v1_labor_projects__project_id__workers_get: {
        parameters: {
            query?: {
                active?: boolean | null;
                /** @description Words in a name or number */
                q?: string | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_LaborWorkerOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_worker_v1_labor_projects__project_id__workers_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkerIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_day_v1_labor_projects__project_id__attendance_get: {
        parameters: {
            query: {
                /** @description YYYY-MM-DD */
                day: string;
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborDayOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    mark_day_v1_labor_projects__project_id__attendance_put: {
        parameters: {
            query: {
                /** @description YYYY-MM-DD */
                day: string;
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MarksIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborDayOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_payments_v1_labor_projects__project_id__payments_get: {
        parameters: {
            query?: {
                worker_id?: string | null;
                from?: string | null;
                to?: string | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_LaborPaymentOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_payment_v1_labor_projects__project_id__payments_post: {
        parameters: {
            query?: never;
            header?: {
                /** @description A unique value per new record (e.g. a UUID); repeat it when retrying. */
                "Idempotency-Key"?: string | null;
            };
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborPaymentOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_marks_said_v1_labor_projects__project_id__attendance_read_post: {
        parameters: {
            query?: {
                /** @description The page's day; today if left out */
                day?: string | null;
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReadMarksIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarksReadOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    project_report_v1_labor_projects__project_id__report_get: {
        parameters: {
            query: {
                from: string;
                to: string;
                group?: components["schemas"]["Grouping"];
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborReportOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    project_report_file_v1_labor_projects__project_id__report_csv_get: {
        parameters: {
            query: {
                from: string;
                to: string;
                group?: components["schemas"]["Grouping"];
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description UTF-8 CSV with a byte-order mark */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": unknown;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_worker_v1_labor_workers__worker_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_worker_v1_labor_workers__worker_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkerIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    set_wage_v1_labor_workers__worker_id__wage_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WageIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    wage_history_v1_labor_workers__worker_id__wages_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWageOut"][];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    worker_history_v1_labor_workers__worker_id__history_get: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerHistoryOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    set_active_v1_labor_workers__worker_id__active_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActiveIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_photo_v1_labor_workers__worker_id__photo_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    put_photo_v1_labor_workers__worker_id__photo_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "image/jpeg": string;
                "image/png": string;
                "image/webp": string;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unsupported Media Type */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    remove_photo_v1_labor_workers__worker_id__photo_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read_id_card_v1_labor_workers__worker_id__id_card_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    put_id_card_v1_labor_workers__worker_id__id_card_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "image/jpeg": string;
                "image/png": string;
                "image/webp": string;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unsupported Media Type */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    remove_id_card_v1_labor_workers__worker_id__id_card_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborWorkerOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    void_payment_v1_labor_payments__payment_id__void_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                payment_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VoidIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborPaymentOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_owners_v1_admin_labor_owners_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborOwnerOut"][];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_projects_v1_admin_labor_projects_get: {
        parameters: {
            query?: {
                owner?: string | null;
                state?: components["schemas"]["ProjectStatus"] | null;
                q?: string | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_LaborAdminProjectOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_workers_v1_admin_labor_projects__project_id__workers_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_LaborWorkerOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    project_report_v1_admin_labor_projects__project_id__report_get: {
        parameters: {
            query: {
                from: string;
                to: string;
                group?: components["schemas"]["Grouping"];
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LaborReportOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    project_report_file_v1_admin_labor_projects__project_id__report_csv_get: {
        parameters: {
            query: {
                from: string;
                to: string;
                group?: components["schemas"]["Grouping"];
            };
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description UTF-8 CSV with a byte-order mark */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": unknown;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    labor_audit_v1_admin_labor_audit_get: {
        parameters: {
            query?: {
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
                project_id?: string | null;
                /** @description project, worker ... */
                entity?: string | null;
                entity_id?: string | null;
                action?: string | null;
                /** @description Words in who did it */
                actor?: string | null;
                from?: string | null;
                to?: string | null;
                /** @description An owner's id (admins only) */
                owner?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_LaborAuditOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    receipt_options_v1_receipts_options_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReceiptsOptions"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_items_v1_receipts_items_get: {
        parameters: {
            query?: {
                sort?: string | null;
                warranty?: components["schemas"]["WarrantyStatus"] | null;
                /** @description Words in its name, shop, numbers or note */
                q?: string | null;
                /** @description 1-based page number */
                page?: number;
                /** @description Items per page */
                page_size?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ReceiptsItemOut_"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    add_item_v1_receipts_items_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReceiptsItemIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReceiptsItemOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    get_item_v1_receipts_items__item_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReceiptsItemOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_item_v1_receipts_items__item_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid input */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    change_item_v1_receipts_items__item_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReceiptsItemIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReceiptsItemOut"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
