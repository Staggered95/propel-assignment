import pool from '../config/db.js';
import axios from 'axios';

export const getDispatchSummary = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch the ticket and associated data
        const ticketQuery = `
            SELECT ticket_id, fault_type, target_id, status, affected_count, pincode, created_at
            FROM tickets 
            WHERE ticket_id = $1
        `;
        const ticketRes = await pool.query(ticketQuery, [id]);

        if (ticketRes.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = ticketRes.rows[0];

        // 2. Build the LLM Prompt
        const prompt = `
            You are an expert utility grid dispatcher. Create a concise, actionable repair brief for the field crew.
            
            Incident Details:
            - Ticket ID: ${ticket.ticket_id}
            - Fault Type: ${ticket.fault_type} (SPAN means a broken wire, CLUSTER means multiple poles dark due to unmapped topology)
            - Target: ${ticket.target_id}
            - Poles Affected: ${ticket.affected_count}
            - Area Pincode: ${ticket.pincode || 'Unknown'}
            - Time Detected: ${ticket.created_at}

            You MUST output ONLY a valid JSON object using this exact schema:
            {
                "priority": "Critical | High | Medium",
                "recommended_crew_size": 0,
                "equipment_needed": ["list", "of", "items"],
                "safety_warnings": ["list", "of", "warnings"],
                "dispatch_summary": "A strict two-sentence summary of what the crew needs to do."
            }
        `;

        console.log(`🧠 Generating Groq dispatch summary for Ticket ${id}...`);

        // 3. Call Groq
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const evaluationData = JSON.parse(response.data.choices[0].message.content);
        console.log("✅ Dispatch summary generated.");
        
        res.json(evaluationData);

    } catch (error) {
        console.error("Groq AI Error:", error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate dispatch summary.' });
    }
};

// Also adding a quick endpoint to fetch all tickets for the frontend UI
export const getTickets = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};