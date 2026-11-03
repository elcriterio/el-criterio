require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));

app.get("/api/status", (_req, res) => {
  res.json({
    success: true,
    application: "EL CRITERIO",
    message: "El servidor está funcionando correctamente."
  });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "La ruta solicitada no existe."
    });
  }

  res.status(404).sendFile(path.join(publicPath, "404.html"));
});

app.use((err, _req, res, _next) => {
  console.error("Error del servidor:", err);
  res.status(500).json({
    success: false,
    message: "Ocurrió un error interno del servidor."
  });
});

app.listen(PORT, () => {
  console.log(`EL CRITERIO está funcionando en el puerto ${PORT}`);
});
