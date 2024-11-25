require('dotenv').config(); // Cargar las variables del archivo .env

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware para procesar los datos del formulario
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar a MongoDB Atlas usando la URI del archivo .env
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Esquema del auto
const autoSchema = new mongoose.Schema({
    idDia: { type: Number, required: true }, // Nuevo campo para ID personalizado
    placas: { type: String, required: true },
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    color: { type: String, required: true },
    precio: { type: Number, required: true, min: 0 },
    lavador: { type: String, required: true },
    fechaRegistro: { type: String, required: true }, // Guardamos la fecha como texto
    horaRegistro: { type: String, required: true }  // Guardamos la hora como texto
});

const Auto = mongoose.model('Auto', autoSchema);

// Ruta para mostrar el formulario de captura y la lista de autos del día
app.get('/', async (req, res) => {
    try {
        // Obtener la fecha actual en formato MM/DD/YYYY
        const hoy = new Date();
        const fechaHoy = hoy.toLocaleDateString("en-US"); // Ejemplo: "11/25/2024"

        // Filtrar registros que coincidan con la fecha actual
        const autosDelDia = await Auto.find({ fechaRegistro: fechaHoy });

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sistema de Autolavado</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
            <style>
                body {
                    background-color: #f7f9fc;
                }
                .container {
                    max-width: 900px;
                    margin-top: 50px;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .form-label {
                    font-weight: bold;
                }
                .table-striped {
                    margin-top: 20px;
                }
                .btn-success {
                    background-color: #28a745;
                    border-color: #28a745;
                }
                .btn-success:hover {
                    background-color: #218838;
                }
                .form-section {
                    padding: 10px 20px;
                    margin-bottom: 20px;
                }
                .form-control {
                    margin-bottom: 10px;
                }
                .row {
                    margin-bottom: 15px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="my-4 text-center">Sistema de Registro de Clientes del Autolavado</h1>

                <!-- Formulario para capturar nuevos autos -->
                <div class="form-section">
                    <form action="/registrar-auto" method="POST">
                        <div class="row">
                            <div class="col-md-6">
                                <label for="placas" class="form-label">Placas del vehículo:</label>
                                <input type="text" class="form-control" id="placas" name="placas" required>
                            </div>
                            <div class="col-md-6">
                                <label for="marca" class="form-label">Marca del coche:</label>
                                <input type="text" class="form-control" id="marca" name="marca" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <label for="modelo" class="form-label">Modelo del coche:</label>
                                <input type="text" class="form-control" id="modelo" name="modelo" required>
                            </div>
                            <div class="col-md-6">
                                <label for="color" class="form-label">Color del coche:</label>
                                <input type="text" class="form-control" id="color" name="color" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <label for="precio" class="form-label">Precio del servicio:</label>
                                <input type="number" class="form-control" id="precio" name="precio" required min="0">
                            </div>
                            <div class="col-md-6">
                                <label for="lavador" class="form-label">Lavador asignado:</label>
                                <input type="text" class="form-control" id="lavador" name="lavador" required>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success btn-block">Registrar</button>
                    </form>
                </div>

                <h2 class="my-4">Registros del Día</h2>
                <p>Total de servicios acumulados hoy: ${autosDelDia.length}</p>

                <h2>Lista de Autos Registrados Hoy</h2>
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Placas</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Color</th>
                            <th>Precio</th>
                            <th>Lavador</th>
                            <th>Fecha Registro</th>
                            <th>Hora Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${autosDelDia.map(auto => `
                            <tr>
                                <td>${auto.idDia}</td>
                                <td>${auto.placas}</td>
                                <td>${auto.marca}</td>
                                <td>${auto.modelo}</td>
                                <td>${auto.color}</td>
                                <td>${auto.precio}</td>
                                <td>${auto.lavador}</td>
                                <td>${auto.fechaRegistro}</td>
                                <td>${auto.horaRegistro}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        `);
    } catch (error) {
        console.error('Error al cargar los autos del día:', error);
        res.status(500).send('Error al cargar los autos');
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
