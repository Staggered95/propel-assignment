# KSPDB Fault Localization System

## What It Does

The KSPDB Fault Localization System is a resilient, containerized grid management platform designed to track real-time power grid outages. It ingests high-volume telemetry from IoT pole sensors, calculates exact fault boundaries (or isolates clusters where topology data is missing), and generates debounced, actionable dispatch tickets for control room operators. It is built to accurately resolve root causes despite simulating real-world physics constraints like 30% packet loss and offline legacy sensors.

---

## Quick Links

* **Live Public URL:** [freeflowenergy.duckdns.org](https://freeflowenergy.duckdns.org)
* **Demo Video:** [Watch the 5-Minute Walkthrough](https://drive.google.com/file/d/1soyaw06mBLZ_O3BFp9oqmOGp1UsQ16ix/view?usp=sharing)
* **Repository:** [Staggered95/propel-assignment](https://github.com/Staggered95/propel-assignment)

---

## One-Command Start (Local Evaluation)

A reviewer can boot this entire stack locally using standard HTTP without needing to configure SSL certificates, database passwords, or `.env` files.

**1. Clone the repository:**

```bash
git clone https://github.com/Staggered95/propel-assignment.git
cd propel-assignment

```

**2. Boot the stack:**

```bash
docker compose up -d --build

```

**3. Access the Console:**
Wait approximately 10 seconds for the database to complete its `init.sql` seeding script, then open your browser to:

* **http://localhost:80**

*Note: For detailed configuration, environment variables, and troubleshooting, please refer to [DEPLOYMENT.md](./DEPLOYMENT.md).*

---

## Documentation Map

To understand the philosophy, algorithms, and trade-offs behind this project, please explore the following documentation files:

* **[ARCHITECTURE.md](./ARCHITECTURE.md):** The system design, data flow diagram, in-memory topology cache, localization algorithm explanation, and API surface.
* **[DEPLOYMENT.md](./DEPLOYMENT.md):** The comprehensive guide to running the system, configuring environment variables, verifying success, and troubleshooting common local deployment errors.
* **[DECISIONS.md](./DECISIONS.md):** A chronological log of major architectural choices, rejected alternatives, assumptions made regarding ambiguous constraints, and a roadmap for future improvements.
* **[AI-WORKFLOW.md](./AI-WORKFLOW.md):** A transparent breakdown of how AI was utilized as an architectural sounding board, what was manually written versus delegated, and concrete examples of catching AI hallucinations.