import express, { type Application, type Request, type Response } from 'express'


const app : Application = express()
const port = 5000

app.use(express.json())



app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Express Server', author: 'Kevin Volland' })
});

app.post('/', async(req: Request, res: Response) => {

    console.log(req.body)
    res.status(200).json({ received: req.body })

    })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
