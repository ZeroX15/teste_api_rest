import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

interface UploadRequest {
    image: string;
    costumer_code: string;
    measure_datetime: Date;
    measure_type: 'WATER' | 'GAS';
}

const uploadSchema = Joi.object<UploadRequest>({
    image: Joi.string()
        .base64()
        .required(),
    costumer_code: Joi.string()
        .required(),
    measure_datetime: Joi.date()
        .required(),
    measure_type: Joi.string()
        .valid('WATER', 'GAS')
        .required()
})


const app = express();   
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/upload', async (req, res) => {
    const { error } = uploadSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description: error.details[0].message 
        });
    }

    try {
        const { imageBase64 } = req.body;

        const response = await axios.post('https://api.gemini.com/v1/process_image', {
            image: imageBase64
        });

        const valor = response.data.valor;

        const guid = uuidv4();
        const linkTemporario = `https://seu-servidor/imagens/${guid}.jpg`;

        res.status(200).json({
            image_url: linkTemporario,
            measure_value: valor,
            measure_uuid: guid
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Erro ao processar a imagem' });
    }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});