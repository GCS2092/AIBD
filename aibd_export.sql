--
-- PostgreSQL database dump
-- (ligne \restrict supprimée : commande psql, non exécutable dans l'éditeur SQL Supabase)
--
-- Dumped from database version 17.5
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: cancellations_cancelledby_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'cancellations_cancelledby_enum') THEN
    CREATE TYPE public.cancellations_cancelledby_enum AS ENUM (
        'client',
        'driver',
        'admin',
        'system'
    );
  END IF;
END
$$;


ALTER TYPE public.cancellations_cancelledby_enum OWNER TO postgres;

--
-- Name: drivers_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'drivers_status_enum') THEN
    CREATE TYPE public.drivers_status_enum AS ENUM (
        'available',
        'on_ride',
        'unavailable',
        'on_break'
    );
  END IF;
END
$$;


ALTER TYPE public.drivers_status_enum OWNER TO postgres;

--
-- Name: internal_notifications_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'internal_notifications_type_enum') THEN
    CREATE TYPE public.internal_notifications_type_enum AS ENUM (
        'ride_created',
        'ride_accepted',
        'ride_refused',
        'ride_started',
        'ride_completed',
        'ride_cancelled',
        'driver_assigned',
        'driver_verified',
        'payment_received',
        'refund_processed',
        'system_alert'
    );
  END IF;
END
$$;


ALTER TYPE public.internal_notifications_type_enum OWNER TO postgres;

--
-- Name: notifications_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'notifications_status_enum') THEN
    CREATE TYPE public.notifications_status_enum AS ENUM (
        'pending',
        'sent',
        'failed'
    );
  END IF;
END
$$;


ALTER TYPE public.notifications_status_enum OWNER TO postgres;

--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'notifications_type_enum') THEN
    CREATE TYPE public.notifications_type_enum AS ENUM (
        'push',
        'whatsapp',
        'sms',
        'email'
    );
  END IF;
END
$$;


ALTER TYPE public.notifications_type_enum OWNER TO postgres;

--
-- Name: pricing_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'pricing_type_enum') THEN
    CREATE TYPE public.pricing_type_enum AS ENUM (
        'standard',
        'peak_hours',
        'night',
        'special'
    );
  END IF;
END
$$;


ALTER TYPE public.pricing_type_enum OWNER TO postgres;

--
-- Name: rides_ridetype_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'rides_ridetype_enum') THEN
    CREATE TYPE public.rides_ridetype_enum AS ENUM (
        'dakar_to_airport',
        'airport_to_dakar'
    );
  END IF;
END
$$;


ALTER TYPE public.rides_ridetype_enum OWNER TO postgres;

--
-- Name: rides_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'rides_status_enum') THEN
    CREATE TYPE public.rides_status_enum AS ENUM (
        'pending',
        'assigned',
        'accepted',
        'driver_on_way',
        'picked_up',
        'in_progress',
        'completed',
        'cancelled'
    );
  END IF;
END
$$;


ALTER TYPE public.rides_status_enum OWNER TO postgres;

--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'users_role_enum') THEN
    CREATE TYPE public.users_role_enum AS ENUM (
        'admin',
        'driver'
    );
  END IF;
END
$$;


ALTER TYPE public.users_role_enum OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cancellations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.cancellations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "rideId" uuid NOT NULL,
    reason text NOT NULL,
    refunded boolean DEFAULT false NOT NULL,
    "refundAmount" numeric(10,2),
    "refundedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "cancelledBy" public.cancellations_cancelledby_enum NOT NULL
);


ALTER TABLE public.cancellations OWNER TO postgres;

--
-- Name: config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    description character varying(500),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.config OWNER TO postgres;

--
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.drivers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "consecutiveRides" integer DEFAULT 0 NOT NULL,
    "totalRides" integer DEFAULT 0 NOT NULL,
    rating numeric(10,2) DEFAULT 0 NOT NULL,
    "ratingCount" integer DEFAULT 0 NOT NULL,
    "registrationToken" character varying(500),
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    status public.drivers_status_enum DEFAULT 'unavailable'::public.drivers_status_enum NOT NULL,
    "workSchedule" json,
    "licenseNumber" character varying(500),
    "serviceZone" character varying(500)
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- Name: fcm_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    token character varying(500) NOT NULL,
    device_label character varying(100),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fcm_tokens OWNER TO postgres;

--
-- Name: internal_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.internal_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    type public.internal_notifications_type_enum NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    "rideId" uuid,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp without time zone,
    metadata json,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.internal_notifications OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    "rideId" uuid,
    "errorMessage" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    type public.notifications_type_enum NOT NULL,
    status public.notifications_status_enum DEFAULT 'pending'::public.notifications_status_enum NOT NULL,
    metadata json
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: pricing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    "rideType" character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    "startTime" character varying(20),
    "endTime" character varying(20),
    "isActive" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    type public.pricing_type_enum DEFAULT 'standard'::public.pricing_type_enum NOT NULL,
    "daysOfWeek" json,
    "tripType" character varying(50)
);


ALTER TABLE public.pricing OWNER TO postgres;

--
-- Name: ride_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.ride_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "rideId" uuid NOT NULL,
    "driverId" uuid NOT NULL,
    status character varying(50) NOT NULL,
    "offeredAt" timestamp without time zone DEFAULT now() NOT NULL,
    "respondedAt" timestamp without time zone,
    "refusalReason" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ride_assignments OWNER TO postgres;

--
-- Name: rides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.rides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "scheduledAt" timestamp without time zone NOT NULL,
    "driverId" uuid,
    "pricingId" uuid,
    price numeric(10,2) NOT NULL,
    "assignedAt" timestamp without time zone,
    "acceptedAt" timestamp without time zone,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "cancelledAt" timestamp without time zone,
    "cancelledBy" character varying(50),
    rating integer,
    review text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "rideType" public.rides_ridetype_enum NOT NULL,
    status public.rides_status_enum DEFAULT 'pending'::public.rides_status_enum NOT NULL,
    "driverLocation" json,
    "pickupLocation" json,
    "dropoffLocation" json,
    client_phone_hash character varying(255),
    client_email_hash character varying(255),
    "clientFirstName" character varying(200) NOT NULL,
    "clientLastName" character varying(200) NOT NULL,
    "clientPhone" character varying(500) NOT NULL,
    "clientEmail" character varying(500),
    "pickupAddress" character varying(1000) NOT NULL,
    "dropoffAddress" character varying(1000) NOT NULL,
    "flightNumber" character varying(200),
    "cancellationReason" character varying(1000),
    "accessCode" character varying(8) NOT NULL,
    "assignmentAttempts" integer DEFAULT 0 NOT NULL,
    "lastAssignmentAttempt" timestamp without time zone,
    "tripType" character varying(50),
    "pickupCountry" character varying(200),
    "pickupCity" character varying(200),
    "pickupQuartier" character varying(200),
    "dropoffCountry" character varying(200),
    "dropoffCity" character varying(200),
    "dropoffQuartier" character varying(200)
);


ALTER TABLE public.rides OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "driverId" uuid,
    role public.users_role_enum DEFAULT 'driver'::public.users_role_enum NOT NULL,
    email_hash character varying(255),
    phone_hash character varying(255),
    phone character varying(500) NOT NULL,
    email character varying(255) NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "driverId" uuid NOT NULL,
    brand character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    "licensePlate" character varying(50) NOT NULL,
    color character varying(50),
    year integer,
    capacity integer,
    "photoUrl" character varying(500),
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vehicles OWNER TO postgres;

-- (données cancellations omises pour éditeur SQL Supabase)
--
-- (données config omises - réimporter via psql si besoin)
--
-- (données drivers omises)
--
-- (données fcm_tokens omises)
--
-- Data for Name: internal_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- (données omises pour éditeur SQL Supabase)

--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- (données omises pour éditeur SQL Supabase)

--
-- Data for Name: pricing; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- (données omises pour éditeur SQL Supabase)

--
-- Data for Name: ride_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- (données omises pour éditeur SQL Supabase)

--
-- Data for Name: rides; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- (données omises pour éditeur SQL Supabase)

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- (données omises pour éditeur SQL Supabase)

--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- (données omises pour éditeur SQL Supabase)

--
-- Name: ride_assignments PK_4693cf927f56b23c290332afc35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_assignments
    ADD CONSTRAINT "PK_4693cf927f56b23c290332afc35" PRIMARY KEY (id);


--
-- Name: internal_notifications PK_709cef32600e92750d14a6c177d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_notifications
    ADD CONSTRAINT "PK_709cef32600e92750d14a6c177d" PRIMARY KEY (id);


--
-- Name: config PK_d0ee79a681413d50b0a4f98cf7b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT "PK_d0ee79a681413d50b0a4f98cf7b" PRIMARY KEY (id);


--
-- Name: users UQ_02433f6ac7ad98535b3d7d34da5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_02433f6ac7ad98535b3d7d34da5" UNIQUE ("driverId");


--
-- Name: config UQ_26489c99ddbb4c91631ef5cc791; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT "UQ_26489c99ddbb4c91631ef5cc791" UNIQUE (key);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: cancellations cancellations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancellations
    ADD CONSTRAINT cancellations_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_userId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT "drivers_userId_key" UNIQUE ("userId");


--
-- Name: fcm_tokens fcm_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pricing pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing
    ADD CONSTRAINT pricing_pkey PRIMARY KEY (id);


--
-- Name: rides rides_accessCode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT "rides_accessCode_key" UNIQUE ("accessCode");


--
-- Name: rides rides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_licensePlate_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "vehicles_licensePlate_key" UNIQUE ("licensePlate");


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: cancellations update_cancellations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_cancellations_updated_at BEFORE UPDATE ON public.cancellations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: drivers update_drivers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pricing update_pricing_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON public.pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rides update_rides_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vehicles update_vehicles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users FK_02433f6ac7ad98535b3d7d34da5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_02433f6ac7ad98535b3d7d34da5" FOREIGN KEY ("driverId") REFERENCES public.drivers(id);


--
-- Name: rides FK_0adda088d567495e71d21b6c691; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT "FK_0adda088d567495e71d21b6c691" FOREIGN KEY ("driverId") REFERENCES public.drivers(id);


--
-- Name: ride_assignments FK_218b4f58ad064f81151b0b530b4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_assignments
    ADD CONSTRAINT "FK_218b4f58ad064f81151b0b530b4" FOREIGN KEY ("driverId") REFERENCES public.drivers(id) ON DELETE CASCADE;


--
-- Name: vehicles FK_28d7607488252336b22511e9e80; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "FK_28d7607488252336b22511e9e80" FOREIGN KEY ("driverId") REFERENCES public.drivers(id);


--
-- Name: drivers FK_57d866371f392f459cd9ee46f6a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT "FK_57d866371f392f459cd9ee46f6a" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: fcm_tokens FK_642d4f7ba5c6e019c2d8f5332a5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT "FK_642d4f7ba5c6e019c2d8f5332a5" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: internal_notifications FK_65c3d3f9fd0ea6698a14e1e465f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_notifications
    ADD CONSTRAINT "FK_65c3d3f9fd0ea6698a14e1e465f" FOREIGN KEY ("rideId") REFERENCES public.rides(id);


--
-- Name: rides FK_b5d054f216b645078cbdf0ac556; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT "FK_b5d054f216b645078cbdf0ac556" FOREIGN KEY ("pricingId") REFERENCES public.pricing(id);


--
-- Name: internal_notifications FK_e6ae3f2c8654f98ce24e88a13e9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_notifications
    ADD CONSTRAINT "FK_e6ae3f2c8654f98ce24e88a13e9" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: ride_assignments FK_ecb13a5d7a9413f4e3052208e50; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_assignments
    ADD CONSTRAINT "FK_ecb13a5d7a9413f4e3052208e50" FOREIGN KEY ("rideId") REFERENCES public.rides(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


