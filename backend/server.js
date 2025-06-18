import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb, {sql} from "./config/db.js";
import {ratelimiter} from "./meddleware/rate-limiter.js";

dotenv.config();

const app = express();

app.use(ratelimiter);
app.use(cors());
app.use(express.json());


app.post('/api/transactions', async (req, res) => {
  try {
    const {user_id, title, amount, category} = req.body;
    if(!user_id || !title || !category || amount < 0 || !amount) {
      return res.status(400).json({message: "Todos os campos são obrigatórios"});
    }
    const result = await sql.query(
      "INSERT INTO transactions (user_id, title, amount, category) VALUES ($1, $2, $3, $4) RETURNING *",
       [user_id, title, amount, category]
      );
    return res.status(201).json({data: result[0]});
  } catch (error) {
    return res.status(500).json({message: `Internal Server Error> ${error.message}`});
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const {id} = req.params;

    const result = await sql.query(
      "SELECT * FROM transactions WHERE user_id = $1  ORDER BY created_at DESC",
       [id]
      );
    return res.status(200).json({data: result});
  } catch (error) {
    return res.status(500).json({message: `Internal Server Error> ${error.message}`});
  }
});

app.get('/api/transactions/summary/:id', async (req, res) => {
  try {
    const {id} = req.params;

    const gastos = await sql.query(
      "SELECT COALESCE(SUM(amount), 0) as gastos FROM transactions WHERE user_id = $1 AND category = 'gastos'",
       [id]
      );

    const entradas = await sql.query(
      "SELECT COALESCE(SUM(amount), 0) as entrada FROM transactions WHERE user_id = $1 AND category = 'entrada'",
       [id]
      );

    return res.status(200).json({data: {
      gastos: gastos[0].gastos,
      entradas: entradas[0].entrada,
      saldo: entradas[0].entrada - gastos[0].gastos
    }});
  } catch (error) {
    return res.status(500).json({message: `Internal Server Error> ${error.message}`});
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const {id} = req.params;

    if(isNaN(Number(id))) {
      return res.status(404).json({message: "Transação não encontrada"});
    }

    const result = await sql.query(
      "DELETE FROM transactions WHERE id = $1  RETURNING *",
       [id]
      );
    if(result.length === 0) {
      return res.status(404).json({message: "Transação não encontrada"});
    }
    return res.status(200).json({message: "Transação deletada com sucesso"});
  } catch (error) {
    return res.status(500).json({message: `Internal Server Error> ${error.message}`});
  }
});

const PORT = process.env.PORT || 8080;
connectDb(process.env.DATABASE_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})

