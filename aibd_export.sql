--
-- PostgreSQL database dump
--

\restrict JBehsTBfH1OV6jEW1MLPkERNqqPbpi2CxipAZSsIfG1tTm9YTpFMZC2KTqudl60

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

CREATE TYPE public.cancellations_cancelledby_enum AS ENUM (
    'client',
    'driver',
    'admin',
    'system'
);


ALTER TYPE public.cancellations_cancelledby_enum OWNER TO postgres;

--
-- Name: drivers_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.drivers_status_enum AS ENUM (
    'available',
    'on_ride',
    'unavailable',
    'on_break'
);


ALTER TYPE public.drivers_status_enum OWNER TO postgres;

--
-- Name: internal_notifications_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

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


ALTER TYPE public.internal_notifications_type_enum OWNER TO postgres;

--
-- Name: notifications_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notifications_status_enum AS ENUM (
    'pending',
    'sent',
    'failed'
);


ALTER TYPE public.notifications_status_enum OWNER TO postgres;

--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'push',
    'whatsapp',
    'sms',
    'email'
);


ALTER TYPE public.notifications_type_enum OWNER TO postgres;

--
-- Name: pricing_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.pricing_type_enum AS ENUM (
    'standard',
    'peak_hours',
    'night',
    'special'
);


ALTER TYPE public.pricing_type_enum OWNER TO postgres;

--
-- Name: rides_ridetype_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.rides_ridetype_enum AS ENUM (
    'dakar_to_airport',
    'airport_to_dakar'
);


ALTER TYPE public.rides_ridetype_enum OWNER TO postgres;

--
-- Name: rides_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

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


ALTER TYPE public.rides_status_enum OWNER TO postgres;

--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_role_enum AS ENUM (
    'admin',
    'driver'
);


ALTER TYPE public.users_role_enum OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
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

CREATE TABLE public.cancellations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.drivers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.fcm_tokens (
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

CREATE TABLE public.internal_notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.pricing (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.ride_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.rides (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

CREATE TABLE public.vehicles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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

--
-- Data for Name: cancellations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cancellations (id, "rideId", reason, refunded, "refundAmount", "refundedAt", "createdAt", "updatedAt", "cancelledBy") FROM stdin;
\.


--
-- Data for Name: config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.config (id, key, value, description, "createdAt", "updatedAt") FROM stdin;
bb7ddc5b-d2b0-4e34-bd88-86315414912e	driver_response_timeout	120	Timeout de réponse chauffeur en secondes (2 minutes)	2025-11-25 00:20:48.288544	2025-11-25 00:20:48.288544
b91c17e4-dbb6-49e4-8b47-ed0720c147b5	auto_break_after_rides	5	Nombre de courses avant pause automatique	2025-11-25 00:20:48.433448	2025-11-25 00:20:48.433448
6c66dce1-1fca-49de-b189-194727d33622	cancellation_refund_hours_24	24	Heures avant course pour remboursement 100%	2025-11-25 00:20:48.4865	2025-11-25 00:20:48.4865
2c0f27db-462e-4232-a04e-2cc8014df8fe	cancellation_refund_hours_2	2	Heures avant course pour remboursement 50%	2025-11-25 00:20:48.505564	2025-11-25 00:20:48.505564
68553e25-e099-466b-940f-cedfa9dcd0eb	max_consecutive_refusals	3	Nombre maximum de refus consécutifs avant alerte	2025-11-25 00:20:48.533646	2025-11-25 00:20:48.533646
6b51d38a-766a-4e6d-bdb2-353bb7bae605	simultaneous_offer_count	3	Nombre de chauffeurs ?? proposer simultan??ment (3-5 recommand??)	2025-11-25 15:38:00.595721	2025-11-25 15:38:00.595721
fdf55a5d-48be-4f1b-b25d-2a310c96e034	multiple_offer_timeout	90	Timeout en secondes pour les propositions multiples (90 secondes)	2025-11-25 15:38:00.595721	2025-11-25 15:38:00.595721
1574895d-2b66-454b-94a5-9a4e04a687ae	max_assignment_attempts	7	Nombre maximum de tentatives d'assignation avant passage en attente manuelle	2025-11-25 15:38:00.595721	2025-11-25 15:38:00.595721
89a15696-75a3-4ef7-8308-3d11e9c0de14	max_assignment_distance	50	Distance maximale en km pour l'assignation (g??olocalisation)	2025-11-25 15:38:00.595721	2025-11-25 15:38:00.595721
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers (id, "userId", "consecutiveRides", "totalRides", rating, "ratingCount", "registrationToken", "isVerified", "createdAt", "updatedAt", status, "workSchedule", "licenseNumber", "serviceZone") FROM stdin;
6853aae7-0eb0-4f49-8a08-65319b3d90b6	15964818-dd60-4dc8-94e5-318edaa00e3d	0	0	0.00	0	\N	t	2025-11-25 00:50:29.18049	2025-11-26 21:32:42.184441	available	\N	LIC000003	\N
00a89b2d-08b3-49d9-b177-17897ff002b7	a720c72d-7358-43cf-b2ee-9e6db64fa345	0	0	0.00	0	\N	t	2025-11-25 00:50:29.154161	2025-11-27 02:16:25.776634	unavailable	\N	LIC000002	\N
adaaeebd-e1de-4341-9b33-3074cea9346e	6eaef181-924c-400f-84ea-a0e66c10d055	0	0	0.00	0	\N	t	2025-11-25 00:50:29.102505	2026-02-09 22:41:21.806777	on_break	\N	LIC000001	\N
\.


--
-- Data for Name: fcm_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fcm_tokens (id, "userId", token, device_label, "createdAt") FROM stdin;
\.


--
-- Data for Name: internal_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.internal_notifications (id, "userId", type, title, message, "rideId", read, "readAt", metadata, "createdAt") FROM stdin;
cd6c6202-aeb3-4aa5-9507-da0574f739a8	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	system_alert	Test de notification	Ceci est une notification de test pour vérifier le workflow	\N	t	2025-11-25 11:22:30.778	{"test":true,"timestamp":"2025-11-25T11:22:30.645Z"}	2025-11-25 11:22:30.66228
30866078-672c-4770-abdf-da76aea3ec63	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	system_alert	Test de notification	Ceci est une notification de test pour vérifier le workflow	\N	t	2025-11-25 11:23:15.927	{"test":true,"timestamp":"2025-11-25T11:23:15.836Z"}	2025-11-25 11:23:15.85184
24b9382f-a417-4835-8672-059d963d7603	a720c72d-7358-43cf-b2ee-9e6db64fa345	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"pickupAddress":"Nord foire ","dropoffAddress":"Aéroport International Blaise Diagne (AIBD)","price":"5000.00"}	2025-11-25 11:23:16.037443
0e5e7919-9c43-4ebd-a494-3a2113569f6a	a720c72d-7358-43cf-b2ee-9e6db64fa345	ride_refused	Course refusée	Vous avez refusé la course. Une autre course vous sera assignée prochainement.	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	\N	2025-11-25 11:23:16.170209
112fc194-40c3-4f20-88a6-215d80b6507f	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_created	Nouvelle course	Une nouvelle course a été créée par STEMK Kan.	92c57861-9dad-4e64-9a39-e47b52552b8d	f	\N	{"clientName":"STEMK Kan"}	2025-11-25 14:20:55.520641
180f055b-bd8d-4f22-9b0c-46c993de80d9	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_accepted	Course acceptée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été acceptée par le chauffeur undefined undefined	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2025-11-27 18:07:34.419	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:28:37.336674
610c942b-40d2-4621-8700-6730c010a8de	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_accepted	Course acceptée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été acceptée par le chauffeur undefined undefined	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-27 18:07:34.777	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:54:18.437214
7e245282-69e0-46b6-8501-09f8ad9b24f8	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_created	Nouvelle course	Une nouvelle course a été créée par Stem Kan .	535659c7-623b-400a-9f8e-2f9e5223b46e	f	\N	{"clientName":"Stem Kan "}	2025-11-25 20:53:47.485714
fb0b66f4-8eea-4689-9a3e-c838077122a6	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_accepted	Course acceptée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été acceptée par le chauffeur undefined undefined	535659c7-623b-400a-9f8e-2f9e5223b46e	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:54:18.643681
b9033766-3aeb-474a-8123-72cf2cd1e410	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_started	Course démarrée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été démarrée par le chauffeur	535659c7-623b-400a-9f8e-2f9e5223b46e	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:54:27.145992
b6df8892-31ee-4f96-84d1-7795decdf8f4	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_completed	Course terminée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été terminée	535659c7-623b-400a-9f8e-2f9e5223b46e	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:59:08.803652
89fa01e8-15cd-4725-9106-9281297a438c	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_completed	Course terminée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été terminée	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-25 21:00:21.57	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:59:08.459517
e66e250d-1cfb-442f-81c7-95b4e8a35061	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_accepted	Course acceptée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été acceptée par le chauffeur undefined undefined	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-25 21:00:27.172	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:54:18.619187
ac00b880-1d8c-493e-ae69-717c02fae676	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_started	Course démarrée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été démarrée par le chauffeur	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-25 21:00:27.091	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:54:27.145793
a9d53aa2-2a63-463a-8809-f901f7f042bf	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_created	Nouvelle course	Une nouvelle course a été créée par STEMK Kan.	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2025-11-25 21:00:28.507	{"clientName":"STEMK Kan"}	2025-11-25 14:20:55.507296
454561cd-3888-441a-ac86-dbb132143207	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_created	Nouvelle course	Une nouvelle course a été créée par Stem Kan .	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-25 21:00:28.556	{"clientName":"Stem Kan "}	2025-11-25 20:53:47.448521
da8b2db3-8b2f-450f-ae79-d55d7a608873	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_accepted	Course acceptée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été acceptée par le chauffeur undefined undefined	92c57861-9dad-4e64-9a39-e47b52552b8d	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:28:37.336955
74d2b676-72b1-416e-ad07-2a24321592c8	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_started	Course démarrée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été démarrée par le chauffeur	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-27 18:07:34.766	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:54:27.145611
6153d041-3a4a-4fe2-baf8-48ae13122773	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_completed	Course terminée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été terminée	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-27 18:07:34.749	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:59:08.459383
2688a4a9-ff8f-4bbd-80f9-303dde1e8051	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_created	Nouvelle course	Une nouvelle course a été créée par Stem Kan .	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-27 18:07:34.785	{"clientName":"Stem Kan "}	2025-11-25 20:53:47.321994
ee005f69-e1f7-4248-8d45-8deb62049410	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_created	Nouvelle course	Une nouvelle course a été créée par STEMK Kan.	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2025-11-27 18:07:34.808	{"clientName":"STEMK Kan"}	2025-11-25 14:20:55.321073
882819d9-de46-4868-9515-6fe6c9d06f8a	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_cancelled	Course annulée	Votre course a été annulée. Raison: Test d'annulation	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:34.819	{"reason":"Test d'annulation"}	2025-11-25 11:23:16.105231
7cd6818d-ed06-4de8-8a53-e7354d868465	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_accepted	Course acceptée	Votre course a été acceptée par le chauffeur. Il sera bientôt en route.	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:35.221	{"driverName":"Chauffeur2 AIBD"}	2025-11-25 11:23:16.057823
2def5b1d-7fa9-4bb1-89b7-b3ac5b54a556	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_created	Nouvelle course	Une nouvelle course a été créée par Steev Jobs.	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:35.24	{"clientName":"Steev Jobs"}	2025-11-25 11:23:15.993659
4d1c067e-f5f1-4b18-bd8d-ae3c0bb1e5cb	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_completed	Course terminée	Votre course a été terminée avec succès. Merci d'avoir utilisé nos services !	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:35.245	\N	2025-11-25 11:23:16.092209
9761f04f-4523-4817-a00e-62aa173bf4cb	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_started	Course démarrée	Votre chauffeur a démarré la course. Vous pouvez suivre sa progression en temps réel.	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:35.25	\N	2025-11-25 11:23:16.074349
3e3a7431-1ccd-4a5d-9dbf-d414d1be71ae	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_completed	Course terminée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été terminée	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2026-02-08 18:21:40.368	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:59:09.159643
3958ba6b-44d1-4a02-9148-c3d03a0081ab	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_started	Course démarrée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été démarrée par le chauffeur	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2026-02-08 18:21:40.374	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:54:27.145893
6dd7f98a-4a57-4b0b-b060-495e1f140ebf	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_accepted	Course acceptée	La course 535659c7-623b-400a-9f8e-2f9e5223b46e a été acceptée par le chauffeur undefined undefined	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2026-02-08 18:21:40.38	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 20:54:18.58447
293892b1-be5c-4558-960a-f092ca3758d7	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_created	Nouvelle course	Une nouvelle course a été créée par Stem Kan .	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2026-02-08 18:21:40.653	{"clientName":"Stem Kan "}	2025-11-25 20:53:47.510694
f21fedab-0fcf-480f-935e-e4a4e699b6a8	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_created	Nouvelle course	Une nouvelle course a été créée par STEMK Kan.	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2026-02-08 18:21:40.637	{"clientName":"STEMK Kan"}	2025-11-25 14:20:55.500347
90bb481d-6521-469a-ad60-cca5930abc55	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_accepted	Course acceptée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été acceptée par le chauffeur undefined undefined	92c57861-9dad-4e64-9a39-e47b52552b8d	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:28:37.914431
5c0937c2-a1d0-4746-a47a-0c6963b8b99b	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_started	Course démarrée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été démarrée par le chauffeur	92c57861-9dad-4e64-9a39-e47b52552b8d	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:28:54.65664
980fdbf5-37f5-4269-9d97-cff50739a59c	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_started	Course démarrée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été démarrée par le chauffeur	92c57861-9dad-4e64-9a39-e47b52552b8d	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:28:55.873497
5fc37533-e660-48a8-88c5-225b28deb00b	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_completed	Course terminée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été terminée	92c57861-9dad-4e64-9a39-e47b52552b8d	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:46:24.433564
2dff2c68-b9e3-4b46-bdce-4fadfa475f55	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_completed	Course terminée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été terminée	92c57861-9dad-4e64-9a39-e47b52552b8d	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:46:24.898575
368d6df9-0df3-4817-b47e-7e33161f2df5	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_refused	Course refusée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été refusée par le chauffeur undefined undefined	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:22.016608
8810fbf6-1c2d-42b5-949c-bb7d9a76d1f6	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_refused	Course refusée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été refusée par le chauffeur undefined undefined	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:22.110018
e4bbbae5-104f-4a81-877d-ea2e56ae3ebf	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_accepted	Course acceptée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été acceptée par le chauffeur undefined undefined	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:27.582514
df24fe41-6ef4-40ea-9b09-67c9ac4d2a39	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_accepted	Course acceptée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été acceptée par le chauffeur undefined undefined	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:27.585183
f398f662-85f1-44e8-9a6c-4332d6815078	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_started	Course démarrée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été démarrée par le chauffeur	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:30.31094
eeadb12c-6215-4037-a104-9ff0cbb2ecb3	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_started	Course démarrée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été démarrée par le chauffeur	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:30.311103
075ca9fe-b027-4924-82c8-05a27f7cecf4	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_completed	Course terminée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été terminée	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:49.182195
b74d03c7-0dbb-4f77-821e-0e1572db2ce9	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_completed	Course terminée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été terminée	48637282-dd69-4ff6-8422-a11622b811e6	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:49.181962
102ca2ff-4889-48a9-b2ff-f2f5e19fd8b0	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_started	Course démarrée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été démarrée par le chauffeur	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:33.86	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:30.310848
3f0402fe-1a17-46a1-9741-1c8b12202771	6eaef181-924c-400f-84ea-a0e66c10d055	ride_refused	Course refusée	Vous avez refusé la course. Une autre course vous sera assignée prochainement.	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 00:04:37.512	\N	2025-11-25 22:21:21.020504
a0317b33-3481-49e9-935e-e674c873fe25	6eaef181-924c-400f-84ea-a0e66c10d055	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	535659c7-623b-400a-9f8e-2f9e5223b46e	t	2025-11-27 00:04:37.439	{"pickupAddress":"Congo","dropoffAddress":"Colobane ","price":"49900.00"}	2025-11-25 20:53:48.265662
ad96d76e-c691-4690-a63c-25b64629e616	6eaef181-924c-400f-84ea-a0e66c10d055	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2025-11-27 00:04:37.553	{"pickupAddress":"Ouakam","dropoffAddress":"Aéroport International Blaise Diagne (AIBD)","price":"5000.00"}	2025-11-25 14:20:55.737745
e365acfa-de5a-4136-9eb2-260fc63276aa	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_refused	Course refusée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été refusée par le chauffeur undefined undefined	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:33.985	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:21.259828
7095338e-7cee-4c38-9758-f132c567a5b3	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_completed	Course terminée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été terminée	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2025-11-27 18:07:34.399	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:46:24.433462
91c94283-ecda-4270-b29a-9db035bbd906	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_completed	Course terminée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été terminée	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:34.39	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:49.181834
eb7ed147-0573-4e38-9973-5c31fcc6a29a	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_accepted	Course acceptée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été acceptée par le chauffeur undefined undefined	48637282-dd69-4ff6-8422-a11622b811e6	t	2025-11-27 18:07:34.41	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:27.582413
d4de0739-5e00-4d1b-863e-2d7752ea8482	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_started	Course démarrée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été démarrée par le chauffeur	48637282-dd69-4ff6-8422-a11622b811e6	t	2026-02-08 18:21:39.747	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:30.311041
6eafbf32-97b0-47e5-82af-bf8cb178e5f7	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_completed	Course terminée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été terminée	48637282-dd69-4ff6-8422-a11622b811e6	t	2026-02-08 18:21:40.044	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:49.182021
cff3ae61-eef7-45a3-a9c4-60698dab236e	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_accepted	Course acceptée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été acceptée par le chauffeur undefined undefined	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2026-02-08 18:21:40.049	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:28:37.591067
fff3ffb1-02d4-4d87-a36c-08ee55ed936f	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_started	Course démarrée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été démarrée par le chauffeur	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2026-02-08 18:21:40.055	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:28:56.046736
4416f7b8-6712-4b83-9620-e4e5d58d7ba0	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_refused	Course refusée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été refusée par le chauffeur undefined undefined	48637282-dd69-4ff6-8422-a11622b811e6	t	2026-02-08 18:21:40.215	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:21.946895
a182ca1c-38f0-4681-b811-7c2eadfd751d	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_completed	Course terminée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été terminée	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2026-02-08 18:21:40.277	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:46:24.90992
301cca20-9c03-4a93-b42c-f861a9676a2f	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_accepted	Course acceptée	La course 48637282-dd69-4ff6-8422-a11622b811e6 a été acceptée par le chauffeur undefined undefined	48637282-dd69-4ff6-8422-a11622b811e6	t	2026-02-08 18:21:40.324	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 22:21:27.58468
9358907a-a1ae-454b-a419-f1c0a73a322d	6eaef181-924c-400f-84ea-a0e66c10d055	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2025-11-27 00:04:37.533	{"pickupAddress":"Ouakam","dropoffAddress":"Aéroport International Blaise Diagne (AIBD)","price":"5000.00"}	2025-11-25 14:22:55.95028
6e58a1cc-5edd-4d1b-9c09-144bf2b88b4a	15964818-dd60-4dc8-94e5-318edaa00e3d	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"pickupAddress":"Liberté 6","dropoffAddress":"Ouakam ","price":"49900.00"}	2025-11-27 01:58:51.285389
0164d5f2-0e8c-4f58-9279-bdd4493da710	6eaef181-924c-400f-84ea-a0e66c10d055	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	t	2025-11-27 02:03:27.297	{"pickupAddress":"Liberté 6","dropoffAddress":"Ouakam ","price":"49900.00"}	2025-11-27 01:58:51.705076
fb0108d6-bc27-4190-abf5-01810f6a4666	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_accepted	Course acceptée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été acceptée par le chauffeur undefined undefined	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-27 02:03:41.555249
89896c12-2cb8-4352-8d48-a61d0984bb02	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_accepted	Course acceptée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été acceptée par le chauffeur undefined undefined	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-27 02:03:41.765884
bc75bcec-1957-4c9f-baf1-9583db425c12	a720c72d-7358-43cf-b2ee-9e6db64fa345	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	t	2025-11-27 02:07:53.026	{"pickupAddress":"Liberté 6","dropoffAddress":"Ouakam ","price":"49900.00"}	2025-11-27 01:58:51.532169
4ac9a676-9ee8-4d39-8b53-52ef8095ee31	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_created	Nouvelle course	Une nouvelle course a été créée par Coeurson  GAMA.	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	f	\N	{"clientName":"Coeurson  GAMA"}	2025-11-27 15:22:26.831257
9022bf43-eed6-4990-8683-de9a0006feae	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_created	Nouvelle course	Une nouvelle course a été créée par Coeurson  GAMA.	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	f	\N	{"clientName":"Coeurson  GAMA"}	2025-11-27 15:22:26.8392
e5cf7c2f-09c7-4a6e-8299-47bc68143631	15964818-dd60-4dc8-94e5-318edaa00e3d	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	f	\N	{"pickupAddress":"Ouest foire ","dropoffAddress":"Aéroport International Blaise Diagne (AIBD)","price":"5000.00"}	2025-11-27 15:22:27.267606
541b3bdb-e841-4505-8d41-ed06f990943b	6eaef181-924c-400f-84ea-a0e66c10d055	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	t	2025-11-27 15:27:52.089	{"pickupAddress":"Ouest foire ","dropoffAddress":"Aéroport International Blaise Diagne (AIBD)","price":"5000.00"}	2025-11-27 15:22:27.186052
a2cd4a9b-60e6-41d7-a937-28246b347927	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_created	Nouvelle course	Une nouvelle course a été créée par Coeurson  GAMA.	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	t	2025-11-27 18:07:33.166	{"clientName":"Coeurson  GAMA"}	2025-11-27 15:22:26.592554
c8fab245-23cc-49a6-b0b7-ec385e6ca30a	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_accepted	Course acceptée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été acceptée par le chauffeur undefined undefined	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	t	2025-11-27 18:07:34.354	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-27 02:03:41.554765
32470e33-89ed-44a6-800a-31f636dfd719	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_started	Course démarrée	La course 92c57861-9dad-4e64-9a39-e47b52552b8d a été démarrée par le chauffeur	92c57861-9dad-4e64-9a39-e47b52552b8d	t	2025-11-27 18:07:34.415	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-25 21:28:54.602317
b0bf25bd-c62a-4560-b7c7-c1077256870c	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_created	Nouvelle course	Une nouvelle course a été créée par Coeurson  GAMA.	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	t	2026-02-08 18:21:39.349	{"clientName":"Coeurson  GAMA"}	2025-11-27 15:22:26.828643
8f9f375a-dfce-445e-852c-278e970a4710	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_accepted	Course acceptée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été acceptée par le chauffeur undefined undefined	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	t	2026-02-08 18:21:39.494	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2025-11-27 02:03:41.555556
05c03116-a789-4ea4-8ac2-a9bed82de850	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_created	Nouvelle course	Une nouvelle course a été créée par COEURSON GAMA.	f90638f7-8594-420f-923f-024d2bd02dbc	f	\N	{"clientName":"COEURSON GAMA"}	2026-02-08 20:44:20.983762
ce13037e-d757-4e70-a2ca-e6dd1f47d842	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_created	Nouvelle course	Une nouvelle course a été créée par COEURSON GAMA.	f90638f7-8594-420f-923f-024d2bd02dbc	f	\N	{"clientName":"COEURSON GAMA"}	2026-02-08 20:44:21.1078
b5ab20ca-3b9c-4f1e-be83-535c83b8b4b5	5c1e25f2-c7bf-4b3c-b064-5f895c894ac5	ride_created	Nouvelle course	Une nouvelle course a été créée par COEURSON GAMA.	f90638f7-8594-420f-923f-024d2bd02dbc	f	\N	{"clientName":"COEURSON GAMA"}	2026-02-08 20:44:21.129094
386ccdee-2b84-4f80-8ab6-c32d8c61e031	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_created	Nouvelle course	Une nouvelle course a été créée par COEURSON GAMA.	f90638f7-8594-420f-923f-024d2bd02dbc	f	\N	{"clientName":"COEURSON GAMA"}	2026-02-08 20:44:21.159659
e5d80fda-4bc3-4330-a5de-d00d903031cf	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_created	Nouvelle course	Une nouvelle course a été créée par COEURSON GAMA.	f90638f7-8594-420f-923f-024d2bd02dbc	f	\N	{"clientName":"COEURSON GAMA"}	2026-02-08 20:44:21.229183
5cca2dff-39ee-41b8-ba33-217f72e9088a	6eaef181-924c-400f-84ea-a0e66c10d055	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	f90638f7-8594-420f-923f-024d2bd02dbc	f	\N	{"pickupAddress":"ouest foire ","dropoffAddress":"ouest foire","price":"20000.00"}	2026-02-08 20:44:22.044562
90f4458a-fd47-450e-bc19-a10b1c0fc623	15964818-dd60-4dc8-94e5-318edaa00e3d	driver_assigned	Nouvelle course assignée	Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.	f90638f7-8594-420f-923f-024d2bd02dbc	f	\N	{"pickupAddress":"ouest foire ","dropoffAddress":"ouest foire","price":"20000.00"}	2026-02-08 20:44:22.116352
3af985ca-2b92-43fa-8830-8b817fa95d52	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_started	Course démarrée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été démarrée par le chauffeur	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:13.347443
012f7eb2-2600-45b4-ac8a-3a9d298aff87	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_started	Course démarrée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été démarrée par le chauffeur	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:13.535423
95d00096-9d0a-4fdf-80f6-3d076516e04e	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_started	Course démarrée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été démarrée par le chauffeur	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:13.478107
63874a9b-fccb-457f-b538-ab42a2b16a0f	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_started	Course démarrée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été démarrée par le chauffeur	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:13.511472
698a78db-c372-4df7-af80-f0f149300aed	5c1e25f2-c7bf-4b3c-b064-5f895c894ac5	ride_started	Course démarrée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été démarrée par le chauffeur	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:13.512757
12b06052-8879-49d3-8158-6e96c5b813c0	83a174d1-7ae3-4943-bd39-012cd4ee4c0c	ride_completed	Course terminée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été terminée	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:21.835329
a479ad0d-2104-4c3a-8e34-bfb832cb122e	66916b64-c3bf-4244-b3d5-b57f2795cbe3	ride_completed	Course terminée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été terminée	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:21.835433
098522a8-d34f-4f8d-8618-76f147fe295b	ae2a6ea1-a0bf-4988-9924-b97150a3b20e	ride_completed	Course terminée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été terminée	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:21.835503
f1ad3640-ad95-48fb-8413-61a06585aac0	f43a0f66-4ceb-4311-b2f4-b84d77f24b40	ride_completed	Course terminée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été terminée	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:21.835619
4e1c165c-febe-43db-8541-925352da8587	5c1e25f2-c7bf-4b3c-b064-5f895c894ac5	ride_completed	Course terminée	La course 210fd7e1-a679-4354-9ae6-ee1bd3c82df5 a été terminée	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	f	\N	{"driverId":"adaaeebd-e1de-4341-9b33-3074cea9346e"}	2026-02-09 22:41:21.835664
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, recipient, title, message, "rideId", "errorMessage", "createdAt", type, status, metadata) FROM stdin;
d2a7198c-9fbb-435e-b2a0-c974e927b832	73329ee045dd53c2fe9091e73c4d06db:f3185d86f81975b4b1d37adaeaae323b:932b84d7a363a89253a0d14607	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: STEMK Kan\nDépart: Ouakam\nArrivée: Aéroport International Blaise Diagne (AIBD)\nDate: 30/11/2025 14:20:00\nPrix: 5000.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	92c57861-9dad-4e64-9a39-e47b52552b8d	\N	2025-11-25 14:20:55.699382	whatsapp	sent	\N
75dff8d6-88de-4086-a6e9-9a74b24939a1	73329ee045dd53c2fe9091e73c4d06db:f3185d86f81975b4b1d37adaeaae323b:932b84d7a363a89253a0d14607	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: STEMK Kan\nDépart: Ouakam\nArrivée: Aéroport International Blaise Diagne (AIBD)\nDate: 30/11/2025 14:20:00\nPrix: 5000.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	92c57861-9dad-4e64-9a39-e47b52552b8d	\N	2025-11-25 14:22:55.892196	whatsapp	sent	\N
c474bd54-a3ae-4fc0-a614-629fc0e28589	73329ee045dd53c2fe9091e73c4d06db:f3185d86f81975b4b1d37adaeaae323b:932b84d7a363a89253a0d14607	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: Stem Kan \nDépart: Congo\nArrivée: Colobane \nDate: 25/11/2025 20:53:00\nPrix: 49900.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	535659c7-623b-400a-9f8e-2f9e5223b46e	\N	2025-11-25 20:53:48.156601	whatsapp	sent	\N
e0faa317-f0c1-4ee7-8d42-f83724fa876c	+221773659623	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: Exaucé Niafou \nDépart: Liberté 6\nArrivée: Ouakam \nDate: 28/11/2025 01:58:00\nPrix: 49900.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	\N	2025-11-27 01:58:51.093478	whatsapp	sent	\N
6adccd63-7817-4fdd-a237-a7ff0137ca34	+221778550088	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: Exaucé Niafou \nDépart: Liberté 6\nArrivée: Ouakam \nDate: 28/11/2025 01:58:00\nPrix: 49900.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	\N	2025-11-27 01:58:51.368708	whatsapp	sent	\N
e20186b8-9230-4f66-9f69-89e216bb96c6	+221773680540	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: Exaucé Niafou \nDépart: Liberté 6\nArrivée: Ouakam \nDate: 28/11/2025 01:58:00\nPrix: 49900.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	\N	2025-11-27 01:58:51.613406	whatsapp	sent	\N
9022c6c9-8386-4a6d-8a8b-7cac916cbce2	+221773680540	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: Coeurson  GAMA\nDépart: Ouest foire \nArrivée: Aéroport International Blaise Diagne (AIBD)\nDate: 28/11/2025 15:21:00\nPrix: 5000.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	\N	2025-11-27 15:22:27.132801	whatsapp	sent	\N
417e8e88-0b24-4569-9bf9-457befc36efb	+221773659623	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: Coeurson  GAMA\nDépart: Ouest foire \nArrivée: Aéroport International Blaise Diagne (AIBD)\nDate: 28/11/2025 15:21:00\nPrix: 5000.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	\N	2025-11-27 15:22:27.215019	whatsapp	sent	\N
6537295e-4648-408d-a2f3-017883fa7a52	+221773680540	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: COEURSON GAMA\nDépart: ouest foire \nArrivée: ouest foire\nDate: 11/02/2026 11:11:00\nPrix: 20000.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	f90638f7-8594-420f-923f-024d2bd02dbc	\N	2026-02-08 20:44:21.987708	whatsapp	sent	\N
f1fb6385-d520-4a52-aec4-69f0f0a4c154	+221773659623	Nouvelle course assignée	Nouvelle course assignée !\n\nClient: COEURSON GAMA\nDépart: ouest foire \nArrivée: ouest foire\nDate: 11/02/2026 11:11:00\nPrix: 20000.00 FCFA\n\nVeuillez accepter ou refuser dans les 2 minutes.	f90638f7-8594-420f-923f-024d2bd02dbc	\N	2026-02-08 20:44:22.070899	whatsapp	sent	\N
\.


--
-- Data for Name: pricing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pricing (id, name, "rideType", price, "startTime", "endTime", "isActive", description, "createdAt", "updatedAt", type, "daysOfWeek", "tripType") FROM stdin;
b084eb75-fe9d-41cc-9a81-3955b87a22f3	AÃ©roport â†’ Dakar Standard	airport_to_dakar	49900.00	\N	\N	t	Tarif standard pour trajet AÃ©roport vers Dakar	2025-11-24 23:23:51.134191	2025-11-27 18:16:07.858762	standard	\N	\N
d54c0f24-0227-43ef-8eb2-0eec1b5e5296	Dakar â†’ AÃ©roport Standard	dakar_to_airport	5000.00	\N	\N	t	Tarif standard pour trajet Dakar vers AÃ©roport	2025-11-24 23:23:51.134191	2025-11-27 18:16:09.829425	standard	\N	\N
b2ea111d-3a0f-4242-b482-5dc593628668	Aller retour	dakar_to_airport	25000.00	\N	\N	t	Aller retour	2026-02-08 20:40:18.954221	2026-02-08 20:40:18.954221	standard	\N	aller_retour
70183563-e042-4dee-a392-d8baf279790e	Aller simple	dakar_to_airport	20000.00	\N	\N	t	Ville vers A‚roport	2026-02-08 20:40:19.101189	2026-02-08 20:40:19.101189	standard	\N	aller_simple
10adfacf-ac21-4ab1-91f6-7b1059a6fe58	Retour simple	airport_to_dakar	20000.00	\N	\N	t	A‚roport vers Ville	2026-02-08 20:40:19.118387	2026-02-08 20:40:19.118387	standard	\N	retour_simple
\.


--
-- Data for Name: ride_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ride_assignments (id, "rideId", "driverId", status, "offeredAt", "respondedAt", "refusalReason", "createdAt") FROM stdin;
617f7596-a0d1-44df-9b45-faf0ede0a3cd	535659c7-623b-400a-9f8e-2f9e5223b46e	adaaeebd-e1de-4341-9b33-3074cea9346e	accepted	2025-11-25 20:53:47.869	2025-11-25 20:54:18.377	\N	2025-11-25 20:53:47.880436
2e99e286-33a4-40ca-9e03-17b8d8d0ddaf	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	6853aae7-0eb0-4f49-8a08-65319b3d90b6	timeout	2025-11-27 01:58:50.808	2025-11-27 02:00:21.856	\N	2025-11-27 01:58:50.817371
a1a7fb3d-b208-4c42-a75c-3e1e201987d2	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	00a89b2d-08b3-49d9-b177-17897ff002b7	timeout	2025-11-27 01:58:50.809	2025-11-27 02:00:21.896	\N	2025-11-27 01:58:50.817371
d0c5ceed-f637-4431-9baa-e2bac25f59da	210fd7e1-a679-4354-9ae6-ee1bd3c82df5	adaaeebd-e1de-4341-9b33-3074cea9346e	timeout	2025-11-27 01:58:50.809	2025-11-27 02:00:21.92	\N	2025-11-27 01:58:50.817371
554aa2ff-7df0-4d3b-8434-81a39fa6d510	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	adaaeebd-e1de-4341-9b33-3074cea9346e	timeout	2025-11-27 15:22:27.079	2025-11-27 15:23:57.327	\N	2025-11-27 15:22:27.081412
025b1fd8-a6ec-42bb-9cea-ee1938e615c1	4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	6853aae7-0eb0-4f49-8a08-65319b3d90b6	timeout	2025-11-27 15:22:27.08	2025-11-27 15:23:57.377	\N	2025-11-27 15:22:27.081412
134dcb67-0d6c-4a0c-a02d-ff855bd2a43b	f90638f7-8594-420f-923f-024d2bd02dbc	adaaeebd-e1de-4341-9b33-3074cea9346e	timeout	2026-02-08 20:44:21.458	2026-02-08 20:45:52.196	\N	2026-02-08 20:44:21.46206
93f8d557-4976-4ad7-b7ff-c3ee24732300	f90638f7-8594-420f-923f-024d2bd02dbc	6853aae7-0eb0-4f49-8a08-65319b3d90b6	timeout	2026-02-08 20:44:21.459	2026-02-08 20:45:52.217	\N	2026-02-08 20:44:21.46206
\.


--
-- Data for Name: rides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rides (id, "scheduledAt", "driverId", "pricingId", price, "assignedAt", "acceptedAt", "startedAt", "completedAt", "cancelledAt", "cancelledBy", rating, review, "createdAt", "updatedAt", "rideType", status, "driverLocation", "pickupLocation", "dropoffLocation", client_phone_hash, client_email_hash, "clientFirstName", "clientLastName", "clientPhone", "clientEmail", "pickupAddress", "dropoffAddress", "flightNumber", "cancellationReason", "accessCode", "assignmentAttempts", "lastAssignmentAttempt", "tripType", "pickupCountry", "pickupCity", "pickupQuartier", "dropoffCountry", "dropoffCity", "dropoffQuartier") FROM stdin;
f90638f7-8594-420f-923f-024d2bd02dbc	2026-02-11 11:11:00	adaaeebd-e1de-4341-9b33-3074cea9346e	10adfacf-ac21-4ab1-91f6-7b1059a6fe58	20000.00	2026-02-09 22:32:17.514	\N	\N	\N	\N	\N	\N	\N	2026-02-08 20:44:20.896139	2026-02-09 22:32:17.637043	airport_to_dakar	assigned	\N	{"lat":14.7493864,"lng":-17.4702084}	{"lat":14.7493864,"lng":-17.4702084}	\N	\N	COEURSON	GAMA	+221773680570	slovengama@gmail.com	ouest foire 	ouest foire		\N	RFLR2DIF	2	2026-02-08 20:45:52.318	retour_simple	Sénégal	dakar	ouakam	Sénégal	Dakar	\N
210fd7e1-a679-4354-9ae6-ee1bd3c82df5	2025-11-28 01:58:00	adaaeebd-e1de-4341-9b33-3074cea9346e	b084eb75-fe9d-41cc-9a81-3955b87a22f3	49900.00	2025-11-27 02:03:41.324	2025-11-27 02:03:41.324	2026-02-09 22:41:13.201	2026-02-09 22:41:21.755	\N	\N	\N	\N	2025-11-27 01:58:49.898958	2026-02-09 22:41:21.791126	airport_to_dakar	completed	\N	\N	\N	\N	\N	Exaucé	Niafou 	+221774580540	\N	Liberté 6	Ouakam 		\N	XPAT6US5	2	2025-11-27 02:00:22.059	\N	\N	\N	\N	\N	\N	\N
45cbf7b8-01bc-4ef3-a495-493b986d3ede	2025-11-22 07:51:00	adaaeebd-e1de-4341-9b33-3074cea9346e	d54c0f24-0227-43ef-8eb2-0eec1b5e5296	5000.00	2025-11-25 06:57:07.691	2025-11-25 06:57:07.691	2025-11-25 06:57:19.294	2025-11-25 06:57:24.122	\N	\N	\N	\N	2025-11-25 01:45:40.594066	2025-11-25 14:51:23.386105	dakar_to_airport	completed	\N	\N	\N	\N	\N	coeurson	gama	+221773680570	slovengala@gmail.com	ouest foire 	Aéroport International Blaise Diagne (AIBD)		\N	77360429	0	\N	\N	\N	\N	\N	\N	\N	\N
535659c7-623b-400a-9f8e-2f9e5223b46e	2025-11-25 20:53:00	adaaeebd-e1de-4341-9b33-3074cea9346e	b084eb75-fe9d-41cc-9a81-3955b87a22f3	49900.00	2025-11-25 20:54:18.377	2025-11-25 20:54:18.388	2025-11-25 20:54:27.109	2025-11-25 20:59:08.212	\N	\N	\N	\N	2025-11-25 20:53:47.212151	2025-11-25 20:59:08.290811	airport_to_dakar	completed	\N	\N	\N	\N	\N	Stem	Kan 	+221787313729	\N	Congo	Colobane 		\N	DS3AOJKV	1	2025-11-25 20:53:47.888	\N	\N	\N	\N	\N	\N	\N
92c57861-9dad-4e64-9a39-e47b52552b8d	2025-11-30 14:20:00	adaaeebd-e1de-4341-9b33-3074cea9346e	d54c0f24-0227-43ef-8eb2-0eec1b5e5296	5000.00	2025-11-25 14:22:55.821	2025-11-25 21:28:37.129	2025-11-25 21:28:53.959	2025-11-25 21:46:24.298	\N	\N	\N	\N	2025-11-25 14:20:55.225793	2025-11-25 21:46:24.342095	dakar_to_airport	completed	\N	\N	\N	\N	\N	STEMK	Kan	+221773680570	\N	Ouakam	Aéroport International Blaise Diagne (AIBD)		\N	3FF2F568	0	\N	\N	\N	\N	\N	\N	\N	\N
48637282-dd69-4ff6-8422-a11622b811e6	2025-11-27 02:41:00	adaaeebd-e1de-4341-9b33-3074cea9346e	d54c0f24-0227-43ef-8eb2-0eec1b5e5296	5000.00	2025-11-25 22:21:27.491	2025-11-25 22:21:27.491	2025-11-25 22:21:30.262	2025-11-25 22:21:49.088	\N	\N	\N	\N	2025-11-25 02:42:31.747703	2025-11-25 22:21:49.115941	dakar_to_airport	completed	\N	\N	\N	\N	\N	Steev	Jobs	+221787313729	slovengama@gmail.com	Nord foire 	Aéroport International Blaise Diagne (AIBD)		\N	FCDC8775	0	\N	\N	\N	\N	\N	\N	\N	\N
4f524ad6-4cac-4378-9f7b-0b8f4c5645dc	2025-11-28 15:21:00	\N	d54c0f24-0227-43ef-8eb2-0eec1b5e5296	5000.00	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-27 15:22:26.469088	2025-11-27 15:23:57.459213	dakar_to_airport	pending	\N	\N	\N	\N	\N	Coeurson 	GAMA	+221773680540	\N	Ouest foire 	Aéroport International Blaise Diagne (AIBD)		\N	XPH9SXZG	2	2025-11-27 15:23:57.441	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, "firstName", "lastName", password, "isActive", "createdAt", "updatedAt", "driverId", role, email_hash, phone_hash, phone, email) FROM stdin;
83a174d1-7ae3-4943-bd39-012cd4ee4c0c	Admin	AIBD	$2b$10$OspMnyL73HFU04Yb2cQ/DuKqFXAHgbBB.E7uo9j1PJY/C1j7hZJqa	t	2025-11-25 00:04:21.887182	2025-11-25 01:25:09.261689	\N	admin	416845fbb7f3c36b11a78771204779e2a36b1d1d60c77e425c0c023ced64961b	d6ed068b407248150f4cdad07b0e5754aa7f052cf7e3137e1e1782aa4ab015e9	c9629730a1bb46e4b1b5512b3bc72c4e:9d2d83d2cbfd88ac8f41df77aba97932:a1bfc315b4820142134839850d	274119476db3e97eba6d40b88c0bc522:81b169c1c75dfb2560a224bfdbd86518:385b387ff0beb2464fe91937f5
66916b64-c3bf-4244-b3d5-b57f2795cbe3	Admin1	AIBD	$2b$10$0XEyhW1D7w.kRUl4n4P2UeUD6CDyAj9KCXCRmjU/WSbkPK8LsERIG	t	2025-11-25 00:50:28.979938	2025-11-25 01:25:09.302153	\N	admin	75ff8ac46579f8066b8e1729ba3053eb117453102c7e8f651d4fad71c07c37cc	094729f168008daa47e24879b129ed7caef94afcd7a84b2b391ac999b1946041	9a689b9e4910d5695b46fa63cc2ae167:3653bd07637f8763110bbba554fa39df:9ddc1b5c2bc14a2c684b78fbe9	e9148d7e88063e3458818b281456155e:a012467cbee65dc0c42db863005374ca:aadaf1ec978c7b5fdc4a885c2347
ae2a6ea1-a0bf-4988-9924-b97150a3b20e	Admin2	AIBD	$2b$10$0XEyhW1D7w.kRUl4n4P2UeUD6CDyAj9KCXCRmjU/WSbkPK8LsERIG	t	2025-11-25 00:50:29.056839	2025-11-25 01:25:09.306862	\N	admin	9720d93e5d8f3fd685e8769d25c4de78f7f3d92ef4b0de0281f3a65a1c7bab12	7b3d98216befd3a8dc5fcc40d5221530f9b0ee210031677cfd74e0700fd5d44f	f92bab1d3ce384471715b6edb2ae1e6d:d951cb3a065a94ac54a16c5498fe7346:3ca9e940eb638ad617fee446fb	242846e79573f66d15c449b22c9be009:0325626ac26c8a5bbdf9e68e494aff86:50e466c406c0e1e60e81f561689c
f43a0f66-4ceb-4311-b2f4-b84d77f24b40	Admin3	AIBD	$2b$10$0XEyhW1D7w.kRUl4n4P2UeUD6CDyAj9KCXCRmjU/WSbkPK8LsERIG	t	2025-11-25 00:50:29.070869	2025-11-25 01:25:09.31801	\N	admin	c81056fbce098c50aea0e61454c1e1bccb68529567001d8e9906ac4b2ce8f0c1	ff9358949a3986f9bb947078ae4dfba6e05bb7401420b87b64907bbd1d0d4662	c5f6710a72e2c550865663c3779efaaf:31a0c14633b3ea4849326d53ee561a1b:402a3552a86bdc2c94f69a7822	664751ae10b05cd34728cc27b70ec469:acdc0cf1b3d5bcdd36e12369c0a296da:e3af7f01456f9286f078459e728c
15964818-dd60-4dc8-94e5-318edaa00e3d	Chauffeur3	AIBD	$2b$10$0XEyhW1D7w.kRUl4n4P2UeUD6CDyAj9KCXCRmjU/WSbkPK8LsERIG	t	2025-11-25 00:50:29.167866	2025-11-26 21:32:43.522067	\N	driver	498ff55c5996deb76051e7f6445d625c74b27d13ae6c1ab235365aaf86bcd877	a6509ef3383cf1ead8fca5d1b67ecc32ea5cfe1cc3365c895d1f3d9bd62013ee	+221773659623	chauffeur3@aibd.sn
a720c72d-7358-43cf-b2ee-9e6db64fa345	Chauffeur2	AIBD	$2b$10$0XEyhW1D7w.kRUl4n4P2UeUD6CDyAj9KCXCRmjU/WSbkPK8LsERIG	t	2025-11-25 00:50:29.143765	2025-11-26 21:33:49.312518	\N	driver	289ddbaee7243a8b3fc11976e7b8b9512eb7009d4e1d6f05f0d81155ba0c104b	3df3f7f99f486b94890bda28b17648e76e33b742877a2e425f25a3dfdd1cb696	+221778550088	chauffeur2@aibd.sn
6eaef181-924c-400f-84ea-a0e66c10d055	Chauffeur1	AIBD	$2b$10$0XEyhW1D7w.kRUl4n4P2UeUD6CDyAj9KCXCRmjU/WSbkPK8LsERIG	t	2025-11-25 00:50:29.085568	2025-11-26 21:34:33.369953	\N	driver	60f6f5c7a08afbed33e42a92b99f31cdb9b57ee8a6455f3c7610173690bca84f	fdd0dcee7b611b4881ceea511641c1a423e0ff1cf2b0249fe989e79c293644d9	+221773680540	chauffeur1@aibd.sn
5c1e25f2-c7bf-4b3c-b064-5f895c894ac5	Admin	Bakalafoua	$2b$10$AQ.QzMvHO/31Av7lMTtPDORFRzCmeU1ypjBRdTanN3uTSE424wF0i	t	2025-12-13 22:11:41.215101	2025-12-13 22:11:41.215101	\N	admin	d46e8964498ea6542328762b9eba930737caaf9a1d579ced356f2f1a07c92835	e6fcaf009c3eddf894490fd679c0e4a746d76c4cf0a503f752364b3f3130578b	5bbfe9615f78c0df141b6dc0dfa6affc:10cd62752d253235b4cf71ddb6419b61:95f8234f20e2cdf7878d643ce1	fd2bbae969295780ebb025680b03e876:275bdd23e7ed18455bb802cb4c63ebf5:2f836c2718b31e10293894c284795c9407dce93c7421897d
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, "driverId", brand, model, "licensePlate", color, year, capacity, "photoUrl", "isActive", "createdAt", "updatedAt") FROM stdin;
2f5f247b-6446-4b34-8673-b7177c1e9ef6	adaaeebd-e1de-4341-9b33-3074cea9346e	Toyota	Corolla	DK-1234-AB	Blanc	2020	4	\N	t	2025-11-25 06:47:08.905007	2025-11-25 06:47:08.905007
a99fc1d0-8999-4f8f-a98e-764e955b2906	6853aae7-0eb0-4f49-8a08-65319b3d90b6	Mercedes-Benz	Vito	DK-5678-CD	Noir	2019	8	\N	t	2025-11-25 06:47:09.128377	2025-11-25 06:47:09.128377
4fe7dff2-4549-46c0-91d1-ac56980975ac	00a89b2d-08b3-49d9-b177-17897ff002b7	Nissan	Almera	DK-9012-EF	Gris	2021	4	\N	t	2025-11-25 06:47:09.14182	2025-11-25 06:47:09.14182
\.


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

\unrestrict JBehsTBfH1OV6jEW1MLPkERNqqPbpi2CxipAZSsIfG1tTm9YTpFMZC2KTqudl60

