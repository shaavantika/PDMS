--
-- PostgreSQL database dump
--


-- Dumped from database version 17.4
-- Dumped by pg_dump version 18.3 (Homebrew)

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
-- Name: pdms; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pdms;


--
-- Name: deliverystatus; Type: TYPE; Schema: pdms; Owner: -
--

CREATE TYPE pdms.deliverystatus AS ENUM (
    'PENDING',
    'DELIVERED',
    'ACCEPTED',
    'REJECTED'
);


--
-- Name: milestonestatus; Type: TYPE; Schema: pdms; Owner: -
--

CREATE TYPE pdms.milestonestatus AS ENUM (
    'NOT_STARTED',
    'ON_TRACK',
    'AT_RISK',
    'LATE',
    'COMPLETED'
);


--
-- Name: projectstatus; Type: TYPE; Schema: pdms; Owner: -
--

CREATE TYPE pdms.projectstatus AS ENUM (
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'ARCHIVED'
);


--
-- Name: requirementpriority; Type: TYPE; Schema: pdms; Owner: -
--

CREATE TYPE pdms.requirementpriority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


--
-- Name: requirementstatus; Type: TYPE; Schema: pdms; Owner: -
--

CREATE TYPE pdms.requirementstatus AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED'
);


--
-- Name: taskstatus; Type: TYPE; Schema: pdms; Owner: -
--

CREATE TYPE pdms.taskstatus AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'BLOCKED',
    'DONE'
);


--
-- Name: userrole; Type: TYPE; Schema: pdms; Owner: -
--

CREATE TYPE pdms.userrole AS ENUM (
    'ADMIN',
    'PM',
    'MEMBER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: deliveries; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.deliveries (
    id integer NOT NULL,
    project_id integer NOT NULL,
    milestone_id integer,
    title character varying(255) NOT NULL,
    artifact_url character varying(1024),
    description text,
    status pdms.deliverystatus NOT NULL,
    delivered_at timestamp without time zone,
    client_response_notes text,
    closed_at timestamp without time zone,
    created_by integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: deliveries_id_seq; Type: SEQUENCE; Schema: pdms; Owner: -
--

CREATE SEQUENCE pdms.deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: pdms; Owner: -
--

ALTER SEQUENCE pdms.deliveries_id_seq OWNED BY pdms.deliveries.id;


--
-- Name: milestones; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.milestones (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    due_date date,
    status pdms.milestonestatus NOT NULL,
    status_override boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: milestones_id_seq; Type: SEQUENCE; Schema: pdms; Owner: -
--

CREATE SEQUENCE pdms.milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: pdms; Owner: -
--

ALTER SEQUENCE pdms.milestones_id_seq OWNED BY pdms.milestones.id;


--
-- Name: modules; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.modules (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: pdms; Owner: -
--

CREATE SEQUENCE pdms.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: pdms; Owner: -
--

ALTER SEQUENCE pdms.modules_id_seq OWNED BY pdms.modules.id;


--
-- Name: project_members; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.project_members (
    project_id integer NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    client_name character varying(255),
    owner_id integer NOT NULL,
    status pdms.projectstatus NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: pdms; Owner: -
--

CREATE SEQUENCE pdms.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: pdms; Owner: -
--

ALTER SEQUENCE pdms.projects_id_seq OWNED BY pdms.projects.id;


--
-- Name: requirements; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.requirements (
    id integer NOT NULL,
    project_id integer NOT NULL,
    module_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    stakeholder_id integer,
    status pdms.requirementstatus NOT NULL,
    priority pdms.requirementpriority NOT NULL,
    created_by integer NOT NULL,
    approved_by integer,
    approved_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: requirements_id_seq; Type: SEQUENCE; Schema: pdms; Owner: -
--

CREATE SEQUENCE pdms.requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: pdms; Owner: -
--

ALTER SEQUENCE pdms.requirements_id_seq OWNED BY pdms.requirements.id;


--
-- Name: stakeholders; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.stakeholders (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name character varying(255) NOT NULL,
    role_title character varying(255),
    email character varying(255),
    notes text
);


--
-- Name: stakeholders_id_seq; Type: SEQUENCE; Schema: pdms; Owner: -
--

CREATE SEQUENCE pdms.stakeholders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stakeholders_id_seq; Type: SEQUENCE OWNED BY; Schema: pdms; Owner: -
--

ALTER SEQUENCE pdms.stakeholders_id_seq OWNED BY pdms.stakeholders.id;


--
-- Name: tasks; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.tasks (
    id integer NOT NULL,
    requirement_id integer,
    project_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    assignee_id integer,
    status pdms.taskstatus NOT NULL,
    progress_pct integer NOT NULL,
    milestone_id integer,
    due_date date,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: pdms; Owner: -
--

CREATE SEQUENCE pdms.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: pdms; Owner: -
--

ALTER SEQUENCE pdms.tasks_id_seq OWNED BY pdms.tasks.id;


--
-- Name: users; Type: TABLE; Schema: pdms; Owner: -
--

CREATE TABLE pdms.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role pdms.userrole NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    is_approved boolean DEFAULT false NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: pdms; Owner: -
--

CREATE SEQUENCE pdms.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: pdms; Owner: -
--

ALTER SEQUENCE pdms.users_id_seq OWNED BY pdms.users.id;


--
-- Name: deliveries id; Type: DEFAULT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.deliveries ALTER COLUMN id SET DEFAULT nextval('pdms.deliveries_id_seq'::regclass);


--
-- Name: milestones id; Type: DEFAULT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.milestones ALTER COLUMN id SET DEFAULT nextval('pdms.milestones_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.modules ALTER COLUMN id SET DEFAULT nextval('pdms.modules_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.projects ALTER COLUMN id SET DEFAULT nextval('pdms.projects_id_seq'::regclass);


--
-- Name: requirements id; Type: DEFAULT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.requirements ALTER COLUMN id SET DEFAULT nextval('pdms.requirements_id_seq'::regclass);


--
-- Name: stakeholders id; Type: DEFAULT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.stakeholders ALTER COLUMN id SET DEFAULT nextval('pdms.stakeholders_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.tasks ALTER COLUMN id SET DEFAULT nextval('pdms.tasks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.users ALTER COLUMN id SET DEFAULT nextval('pdms.users_id_seq'::regclass);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: milestones milestones_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.milestones
    ADD CONSTRAINT milestones_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (project_id, user_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: requirements requirements_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.requirements
    ADD CONSTRAINT requirements_pkey PRIMARY KEY (id);


--
-- Name: stakeholders stakeholders_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.stakeholders
    ADD CONSTRAINT stakeholders_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_pdms_users_email; Type: INDEX; Schema: pdms; Owner: -
--

CREATE UNIQUE INDEX ix_pdms_users_email ON pdms.users USING btree (email);


--
-- Name: deliveries deliveries_created_by_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.deliveries
    ADD CONSTRAINT deliveries_created_by_fkey FOREIGN KEY (created_by) REFERENCES pdms.users(id);


--
-- Name: deliveries deliveries_milestone_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.deliveries
    ADD CONSTRAINT deliveries_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES pdms.milestones(id);


--
-- Name: deliveries deliveries_project_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.deliveries
    ADD CONSTRAINT deliveries_project_id_fkey FOREIGN KEY (project_id) REFERENCES pdms.projects(id);


--
-- Name: milestones milestones_project_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.milestones
    ADD CONSTRAINT milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES pdms.projects(id);


--
-- Name: modules modules_project_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.modules
    ADD CONSTRAINT modules_project_id_fkey FOREIGN KEY (project_id) REFERENCES pdms.projects(id);


--
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES pdms.projects(id);


--
-- Name: project_members project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.project_members
    ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES pdms.users(id);


--
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES pdms.users(id);


--
-- Name: requirements requirements_approved_by_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.requirements
    ADD CONSTRAINT requirements_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES pdms.users(id);


--
-- Name: requirements requirements_created_by_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.requirements
    ADD CONSTRAINT requirements_created_by_fkey FOREIGN KEY (created_by) REFERENCES pdms.users(id);


--
-- Name: requirements requirements_module_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.requirements
    ADD CONSTRAINT requirements_module_id_fkey FOREIGN KEY (module_id) REFERENCES pdms.modules(id);


--
-- Name: requirements requirements_project_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.requirements
    ADD CONSTRAINT requirements_project_id_fkey FOREIGN KEY (project_id) REFERENCES pdms.projects(id);


--
-- Name: requirements requirements_stakeholder_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.requirements
    ADD CONSTRAINT requirements_stakeholder_id_fkey FOREIGN KEY (stakeholder_id) REFERENCES pdms.stakeholders(id);


--
-- Name: stakeholders stakeholders_project_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.stakeholders
    ADD CONSTRAINT stakeholders_project_id_fkey FOREIGN KEY (project_id) REFERENCES pdms.projects(id);


--
-- Name: tasks tasks_assignee_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.tasks
    ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES pdms.users(id);


--
-- Name: tasks tasks_milestone_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.tasks
    ADD CONSTRAINT tasks_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES pdms.milestones(id);


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES pdms.projects(id);


--
-- Name: tasks tasks_requirement_id_fkey; Type: FK CONSTRAINT; Schema: pdms; Owner: -
--

ALTER TABLE ONLY pdms.tasks
    ADD CONSTRAINT tasks_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES pdms.requirements(id);


--
-- PostgreSQL database dump complete
--


