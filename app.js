const express = require('express');
const app = express();

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

app.get('/predict', (req, res) => {
    res.json({ score: 0.75 });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));

