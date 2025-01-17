import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import env from 'dotenv';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pug from 'pug';
env.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());


 //Cấu hình view engine
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('views', `${__dirname}/views`); //dirname là đường dẫn tới thư mục chứa file index.js 
app.set('view engine', 'pug');

app.use("/", (req, res) => {
  res.render('test', {
    title: 'Test',
    message: 'Hello world'
  });
});
//Cấu hình public folder
app.use(express.static(`${__dirname}/public`));


app.listen(PORT, () => {
  console.log('Server is running on port 3000');
}); 