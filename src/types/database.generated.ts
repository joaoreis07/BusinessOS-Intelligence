export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          locale: string;
          timezone: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; full_name: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          slug: string;
          name: string;
          legal_name: string | null;
          tax_id: string | null;
          business_type: string | null;
          professional_name: string | null;
          specialty: string | null;
          description: string | null;
          biography: string | null;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          address: Json;
          social_links: Json;
          status: Database["public"]["Enums"]["company_status"];
          active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
        Relationships: [];
      };
      company_memberships: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["membership_role"];
          invited_by: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["company_memberships"]["Row"]> & {
          company_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["membership_role"];
        };
        Update: Partial<Database["public"]["Tables"]["company_memberships"]["Row"]>;
        Relationships: [];
      };
      company_settings: {
        Row: {
          id: string;
          company_id: string;
          timezone: string;
          locale: string;
          country_code: string;
          currency: string;
          logo_path: string | null;
          booking_enabled: boolean;
          booking_flow: Database["public"]["Enums"]["booking_flow"];
          booking_min_notice_minutes: number;
          booking_interval_minutes: number;
          booking_horizon_days: number;
          max_appointments_per_day: number | null;
          default_financial_status: Database["public"]["Enums"]["financial_status"];
          theme: string;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          background_color: string;
          scheduling_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_settings"]["Row"]> & { company_id: string };
        Update: Partial<Database["public"]["Tables"]["company_settings"]["Row"]>;
        Relationships: [];
      };
      company_invitations: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          role: Database["public"]["Enums"]["membership_role"];
          token: string;
          status: "pending" | "accepted" | "cancelled" | "expired";
          invited_by: string | null;
          accepted_by: string | null;
          expires_at: string;
          last_sent_at: string;
          accepted_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_invitations"]["Row"]> & {
          company_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_invitations"]["Row"]>;
        Relationships: [];
      };
      workspace_preferences: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          locale: string;
          timezone: string;
          date_format: string;
          time_format: "12h" | "24h";
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workspace_preferences"]["Row"]> & {
          company_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspace_preferences"]["Row"]>;
        Relationships: [];
      };
      company_features: {
        Row: {
          id: string;
          company_id: string;
          feature_key: string;
          enabled: boolean;
          source: string;
          configuration: Json;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_features"]["Row"]> & { company_id: string; feature_key: string };
        Update: Partial<Database["public"]["Tables"]["company_features"]["Row"]>;
        Relationships: [];
      };
      landing_pages: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          meta_description: string | null;
          custom_domain: string | null;
          logo_path: string | null;
          avatar_path: string | null;
          banner_path: string | null;
          published: boolean;
          published_at: string | null;
          seo: Json;
          template_key: string;
          layout_config: Json;
          theme_config: Json;
          integrations_config: Json;
          locale: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["landing_pages"]["Row"]> & { company_id: string; title: string };
        Update: Partial<Database["public"]["Tables"]["landing_pages"]["Row"]>;
        Relationships: [];
      };
      landing_sections: {
        Row: {
          id: string;
          company_id: string;
          landing_page_id: string;
          section_type: Database["public"]["Enums"]["section_type"];
          title: string | null;
          content: Json;
          enabled: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["landing_sections"]["Row"]> & {
          company_id: string;
          landing_page_id: string;
          section_type: Database["public"]["Enums"]["section_type"];
        };
        Update: Partial<Database["public"]["Tables"]["landing_sections"]["Row"]>;
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          company_id: string;
          customer_name: string;
          quote: string;
          rating: number | null;
          photo_path: string | null;
          published: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["testimonials"]["Row"]> & { company_id: string; customer_name: string; quote: string };
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Row"]>;
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          company_id: string;
          bucket_id: string;
          object_path: string;
          kind: Database["public"]["Enums"]["media_kind"];
          alt_text: string | null;
          mime_type: string | null;
          byte_size: number | null;
          width: number | null;
          height: number | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["media_assets"]["Row"]> & {
          company_id: string;
          object_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Row"]>;
        Relationships: [];
      };
      landing_preview_tokens: {
        Row: {
          id: string;
          company_id: string;
          landing_page_id: string;
          token_hash: string;
          expires_at: string;
          created_by: string;
          revoked_at: string | null;
          last_accessed_at: string | null;
          access_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["landing_preview_tokens"]["Row"]> & {
          company_id: string;
          landing_page_id: string;
          token_hash: string;
          expires_at: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["landing_preview_tokens"]["Row"]>;
        Relationships: [];
      };
      landing_gallery_items: {
        Row: {
          id: string;
          company_id: string;
          landing_page_id: string;
          media_asset_id: string;
          caption: string | null;
          alt_text: string | null;
          display_order: number;
          enabled: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["landing_gallery_items"]["Row"]> & {
          company_id: string;
          landing_page_id: string;
          media_asset_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["landing_gallery_items"]["Row"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          category: string | null;
          price: number;
          duration_minutes: number;
          image_path: string | null;
          active: boolean;
          publicly_visible: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & {
          company_id: string;
          name: string;
          price: number;
          duration_minutes: number;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Relationships: [];
      };
      business_hours: {
        Row: {
          id: string;
          company_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["business_hours"]["Row"]> & {
          company_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_hours"]["Row"]>;
        Relationships: [];
      };
      blocked_periods: {
        Row: {
          id: string;
          company_id: string;
          starts_at: string;
          ends_at: string;
          reason: string | null;
          all_day: boolean;
          block_type: string;
          recurrence_rule: Json | null;
          scope: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["blocked_periods"]["Row"]> & {
          company_id: string;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["blocked_periods"]["Row"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          email: string | null;
          phone: string;
          whatsapp: string | null;
          birth_date: string | null;
          gender: string | null;
          city: string | null;
          state: string | null;
          profession: string | null;
          acquisition_source: string | null;
          objectives: string | null;
          status: Database["public"]["Enums"]["customer_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          company_id: string;
          full_name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Relationships: [];
      };
      customer_notes: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string;
          content: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customer_notes"]["Row"]> & {
          company_id: string;
          customer_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_notes"]["Row"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          company_id: string;
          service_id: string;
          customer_id: string;
          starts_at: string;
          ends_at: string;
          status: Database["public"]["Enums"]["appointment_status"];
          objective: string | null;
          customer_notes: string | null;
          internal_notes: string | null;
          source: string;
          idempotency_key: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["appointments"]["Row"]> & {
          company_id: string;
          service_id: string;
          customer_id: string;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Row"]>;
        Relationships: [];
      };
      financial_categories: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          transaction_type: Database["public"]["Enums"]["financial_type"];
          color: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["financial_categories"]["Row"]> & {
          company_id: string;
          name: string;
          transaction_type: Database["public"]["Enums"]["financial_type"];
        };
        Update: Partial<Database["public"]["Tables"]["financial_categories"]["Row"]>;
        Relationships: [];
      };
      financial_transactions: {
        Row: {
          id: string;
          company_id: string;
          category_id: string;
          customer_id: string | null;
          service_id: string | null;
          appointment_id: string | null;
          transaction_type: Database["public"]["Enums"]["financial_type"];
          description: string;
          amount: number;
          status: Database["public"]["Enums"]["financial_status"];
          payment_method: string | null;
          due_date: string;
          paid_at: string | null;
          external_reference: string | null;
          idempotency_key: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["financial_transactions"]["Row"]> & {
          company_id: string;
          category_id: string;
          transaction_type: Database["public"]["Enums"]["financial_type"];
          description: string;
          amount: number;
          due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["financial_transactions"]["Row"]>;
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          price: number;
          currency: string;
          billing_interval: Database["public"]["Enums"]["billing_interval"];
          trial_days: number;
          active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["plans"]["Row"]> & { code: string; name: string; price: number; billing_interval: Database["public"]["Enums"]["billing_interval"] };
        Update: Partial<Database["public"]["Tables"]["plans"]["Row"]>;
        Relationships: [];
      };
      plan_features: {
        Row: {
          id: string;
          plan_id: string;
          feature_key: string;
          enabled: boolean;
          limits: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plan_features"]["Row"]> & { plan_id: string; feature_key: string };
        Update: Partial<Database["public"]["Tables"]["plan_features"]["Row"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          company_id: string;
          plan_id: string;
          status: Database["public"]["Enums"]["subscription_status"];
          provider: Database["public"]["Enums"]["integration_provider"];
          external_customer_id: string | null;
          external_subscription_id: string | null;
          trial_ends_at: string | null;
          current_period_starts_at: string;
          current_period_ends_at: string | null;
          next_payment_at: string | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          grace_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & {
          company_id: string;
          plan_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
        Relationships: [];
      };
      subscription_payments: {
        Row: {
          id: string;
          company_id: string;
          subscription_id: string;
          provider: Database["public"]["Enums"]["integration_provider"];
          external_payment_id: string | null;
          idempotency_key: string | null;
          amount: number;
          currency: string;
          status: Database["public"]["Enums"]["payment_status"];
          payment_method: string | null;
          due_at: string | null;
          paid_at: string | null;
          raw_status: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscription_payments"]["Row"]> & {
          company_id: string;
          subscription_id: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_payments"]["Row"]>;
        Relationships: [];
      };
      platform_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "platform_admin" | "support" | "billing_admin";
          granted_by: string | null;
          granted_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["platform_roles"]["Row"]> & { user_id: string; role: "platform_admin" | "support" | "billing_admin" };
        Update: Partial<Database["public"]["Tables"]["platform_roles"]["Row"]>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          company_id: string | null;
          provider: Database["public"]["Enums"]["integration_provider"];
          external_event_id: string;
          event_type: string;
          status: Database["public"]["Enums"]["event_status"];
          signature_valid: boolean;
          payload: Json;
          attempts: number;
          received_at: string;
          processed_at: string | null;
          next_attempt_at: string | null;
          last_error: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["webhook_events"]["Row"]> & {
          provider: Database["public"]["Enums"]["integration_provider"];
          external_event_id: string;
          event_type: string;
          payload: Json;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Row"]>;
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          company_id: string | null;
          actor_user_id: string | null;
          action: string;
          module: string;
          entity_type: string | null;
          entity_id: string | null;
          request_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]> & { action: string; module: string };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
        Relationships: [];
      };
      integrations: {
        Row: {
          id: string;
          company_id: string;
          provider: Database["public"]["Enums"]["integration_provider"];
          status: Database["public"]["Enums"]["integration_status"];
          external_account_id: string | null;
          public_config: Json;
          encrypted_credentials: string | null;
          last_synced_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["integrations"]["Row"]> & { company_id: string; provider: Database["public"]["Enums"]["integration_provider"] };
        Update: Partial<Database["public"]["Tables"]["integrations"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      public_landing_pages: {
        Row: {
          company_id: string;
          slug: string;
          name: string;
          professional_name: string | null;
          specialty: string | null;
          description: string | null;
          biography: string | null;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          address: Json | null;
          social_links: Json | null;
          title: string;
          meta_description: string | null;
          logo_path: string | null;
          avatar_path: string | null;
          banner_path: string | null;
          seo: Json;
          custom_domain: string | null;
          published_at: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          background_color: string;
          theme: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      public_landing_sections: {
        Row: {
          slug: string;
          section_type: Database["public"]["Enums"]["section_type"];
          title: string | null;
          content: Json;
          display_order: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      public_services: {
        Row: {
          slug: string;
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          price: number;
          duration_minutes: number;
          image_path: string | null;
          display_order: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      public_testimonials: {
        Row: {
          slug: string;
          customer_name: string;
          quote: string;
          rating: number | null;
          photo_path: string | null;
          display_order: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      public_landing_gallery: {
        Row: {
          slug: string;
          id: string;
          object_path: string;
          kind: Database["public"]["Enums"]["media_kind"];
          caption: string | null;
          alt_text: string | null;
          display_order: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      create_company: {
        Args: { company_name: string; requested_slug: string; business_type?: string | null };
        Returns: string;
      };
      get_public_availability: {
        Args: {
          company_slug: string;
          requested_service_id: string;
          date_from: string;
          date_to?: string | null;
        };
        Returns: { slot_start: string; slot_end: string }[];
      };
      get_public_booking_wizard_context: {
        Args: { company_slug: string };
        Returns: Json;
      };
      create_public_appointment: {
        Args: {
          company_slug: string;
          requested_service_id: string;
          requested_starts_at: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          customer_objective?: string | null;
          notes?: string | null;
          idempotency_key?: string | null;
        };
        Returns: { appointment_id: string; appointment_status: Database["public"]["Enums"]["appointment_status"] }[];
      };
      can_configure_scheduling: {
        Args: { target_company_id: string };
        Returns: boolean;
      };
      can_manage_appointments: {
        Args: { target_company_id: string };
        Returns: boolean;
      };
      is_workspace_slot_available: {
        Args: {
          target_company_id: string;
          target_service_id: string;
          requested_starts_at: string;
          exclude_appointment_id?: string | null;
        };
        Returns: boolean;
      };
      create_workspace_appointment: {
        Args: {
          target_service_id: string;
          target_customer_id: string;
          requested_starts_at: string;
          internal_notes?: string | null;
          idempotency_key?: string | null;
        };
        Returns: { appointment_id: string; appointment_status: Database["public"]["Enums"]["appointment_status"] }[];
      };
      update_appointment_status_secure: {
        Args: {
          target_appointment_id: string;
          requested_status: Database["public"]["Enums"]["appointment_status"];
          idempotency_key?: string | null;
        };
        Returns: { appointment_id: string; appointment_status: Database["public"]["Enums"]["appointment_status"] }[];
      };
      cancel_appointment_secure: {
        Args: {
          target_appointment_id: string;
          cancellation_reason?: string | null;
          idempotency_key?: string | null;
        };
        Returns: { appointment_id: string; appointment_status: Database["public"]["Enums"]["appointment_status"] }[];
      };
      reschedule_appointment_secure: {
        Args: {
          target_appointment_id: string;
          requested_starts_at: string;
          idempotency_key?: string | null;
        };
        Returns: {
          appointment_id: string;
          appointment_status: Database["public"]["Enums"]["appointment_status"];
          starts_at: string;
          ends_at: string;
        }[];
      };
      replace_business_hours: {
        Args: {
          target_company_id: string;
          rules: Json;
        };
        Returns: Database["public"]["Tables"]["business_hours"]["Row"][];
      };
      update_scheduling_settings: {
        Args: {
          target_company_id: string;
          settings: Json;
        };
        Returns: Database["public"]["Tables"]["company_settings"]["Row"];
      };
      can_manage_landing: {
        Args: { target_company_id: string };
        Returns: boolean;
      };
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_company_member: { Args: { target_company_id: string }; Returns: boolean };
      has_company_role: {
        Args: { target_company_id: string; allowed_roles: Database["public"]["Enums"]["membership_role"][] };
        Returns: boolean;
      };
      get_platform_overview: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_companies: number;
          active_companies: number;
          trial_companies: number;
          total_subscriptions: number;
          monthly_revenue_cents: number;
        }[];
      };
      list_platform_recent_companies: {
        Args: { limit_count?: number };
        Returns: {
          id: string;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["company_status"];
          created_at: string;
        }[];
      };
      create_subscription_checkout: {
        Args: {
          p_company_id: string;
          p_plan_key: string;
          p_success_url: string;
          p_cancel_url: string;
        };
        Returns: { url: string };
      };
      create_billing_portal: {
        Args: { p_company_id: string; p_return_url: string };
        Returns: { url: string };
      };
      cancel_subscription: {
        Args: { p_company_id: string };
        Returns: { cancelled: boolean };
      };
      connect_integration: {
        Args: {
          p_company_id: string;
          p_provider: Database["public"]["Enums"]["integration_provider"];
          p_credentials: Json;
          p_settings: Json;
        };
        Returns: Json;
      };
      test_integration: {
        Args: {
          p_company_id: string;
          p_provider: Database["public"]["Enums"]["integration_provider"];
        };
        Returns: Json;
      };
      disconnect_integration: {
        Args: {
          p_company_id: string;
          p_provider: Database["public"]["Enums"]["integration_provider"];
        };
        Returns: Json;
      };
      complete_company_onboarding: {
        Args: {
          company_name: string;
          requested_slug: string;
          business_type?: string | null;
          selected_timezone?: string;
          selected_locale?: string;
          selected_country_code?: string;
          selected_currency?: string;
          selected_logo_path?: string | null;
          selected_primary_color?: string;
        };
        Returns: string;
      };
      accept_company_invitation: {
        Args: { invitation_token: string };
        Returns: string;
      };
      is_reserved_slug: {
        Args: { candidate: string };
        Returns: boolean;
      };
      create_landing_preview_token: {
        Args: { target_company_id: string; ttl_minutes?: number };
        Returns: { preview_token: string; expires_at: string; company_slug: string }[];
      };
      validate_landing_preview_token: {
        Args: { preview_token: string; company_slug: string };
        Returns: { company_id: string; landing_page_id: string; token_id: string }[];
      };
      get_preview_landing_payload: {
        Args: { preview_token: string; company_slug: string };
        Returns: Json;
      };
      get_public_slug_status: {
        Args: { company_slug: string };
        Returns: string;
      };
      revoke_landing_preview_token: {
        Args: { preview_token: string };
        Returns: boolean;
      };
    };
    Enums: {
      membership_role:
        | "owner"
        | "admin"
        | "manager"
        | "employee"
        | "member"
        | "viewer";
      company_status: "trial" | "active" | "inactive" | "blocked" | "cancelled";
      booking_flow: "instant_confirmation" | "manual_approval" | "payment_required";
      section_type:
        | "hero"
        | "about"
        | "services"
        | "differentials"
        | "testimonials"
        | "gallery"
        | "faq"
        | "contact"
        | "location"
        | "social"
        | "booking"
        | "footer"
        | "custom";
      customer_status: "new" | "active" | "following" | "inactive";
      appointment_status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
      financial_type: "income" | "expense";
      financial_status: "pending" | "paid" | "cancelled" | "overdue";
      billing_interval: "month" | "year";
      subscription_status:
        | "trial"
        | "active"
        | "pending"
        | "past_due"
        | "cancelled"
        | "suspended"
        | "expired";
      payment_status: "pending" | "approved" | "failed" | "refunded" | "cancelled";
      integration_provider:
        | "mercado_pago"
        | "whatsapp"
        | "email"
        | "google_calendar"
        | "google_meet"
        | "outlook"
        | "apple_calendar"
        | "zapier"
        | "custom";
      integration_status: "disconnected" | "pending" | "connected" | "error" | "revoked";
      event_status: "pending" | "processing" | "processed" | "failed" | "dead_letter";
      media_kind: "logo" | "avatar" | "banner" | "service" | "testimonial" | "gallery" | "document" | "other";
    };
    CompositeTypes: Record<string, never>;
  };
};
