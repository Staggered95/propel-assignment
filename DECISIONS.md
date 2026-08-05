# Decision Log

### Dual-File Docker Compose Strategy
**Chosen:** A base `docker-compose.yml` strictly for HTTP/localhost, and a `docker-compose.prod.yml` for EC2 HTTPS overriding.
**Rejected:** A single compose file containing Let's Encrypt volume mounts, or requiring a manual `.env` file to set database passwords.
**Why:** Acceptance Gate G2 requires the repository to boot cleanly on a reviewer's local machine with a single command and no hand-editing. Mounting missing SSL certificates locally causes Nginx to crash loop. This split allows seamless local grading while preserving a secure, automated CI/CD pipeline for the live deployment.



### In-Memory Topology Mapping
**Chosen:** Loading the entire PostgreSQL adjacency list into a Node.js JavaScript `Map` when the server boots.
**Rejected:** Using `WITH RECURSIVE` SQL queries for every fault evaluation.
**Why:** Simulating batch feeder faults creates a "Thundering Herd" of telemetry packets. Hitting the database with a recursive CTE for every dropped packet caused massive CPU spikes. RAM-based traversal reduces graph resolution time to ~0.001ms, keeping the event loop unblocked.

### Database Schema and Initialization
**Chosen:** An Adjacency List pattern in PostgreSQL (`parent_pole_id` pointing to `pole_id`), seeded via `init.sql`.
**Rejected:** Utilizing a graph database (Neo4j) or a heavy ORM (Prisma/Sequelize).
**Why:** The physical grid is a strict tree topology with no loops; a graph database introduces unnecessary overhead. ORMs frequently cause race conditions in Docker where the Node app attempts to run migrations before the database is ready to accept connections. An `init.sql` script guarantees the schema is ready before the backend starts.

---

## Assumptions Made

**The 60% Unmapped Topology Rule**
I assumed that Distribution Transformers (DTs) are strictly binary regarding their missing data. A transformer either has 100% of its topology mapped (the 40% case) or 0% of its topology mapped (the 60% case). I did not build logic to handle a single transformer containing a mix of known and unknown child relationships. 

**Scheduled Maintenance Behavior**
The brief stated the system receives a feed of active scheduled outages. I assumed this meant the system should completely suppress the creation of a ticket if a fault occurs during that window, rather than creating a ticket and silently auto-verifying it.

---

## Future Roadmap & Known Fragility

**What is currently wrong or fragile:**
The global "Poles Dark" metric calculates the absolute count of offline sensors directly from the network state, rather than summing the `affected_count` of active tickets. Because the 30% packet loss causes a single wire snap to generate overlapping tickets as data trickles in, summing ticket counts creates wildly inflated (duplicate) numbers. The current workaround works, but the ticket aggregation logic itself is fragile under extreme packet loss.

**What I would do with two more weeks:**
1. **Redis Telemetry Queue:** Currently, the simulator blasts the Express backend directly. Under a massive batch load, this taxes the V8 garbage collector. I would introduce a Redis message broker to queue the incoming `power_lost` payloads and process them steadily.
2. **WebSockets for UI:** The operator console relies on React fetching the ticket state. I would implement Socket.io to push database changes to the frontend in real-time, eliminating network polling overhead.