const express = require('express')
const app = express()
const port = 8080; 

// Assuming the search logic was previously in netlify/functions/search/search.js
// Extract that logic to a normal function in the Express environment

// Example: move the search function to another module, e.g., './searchLogic.js'
const searchHandler = require('./searchLogic.js');  // Regular search function now

app.get('/api/search', async (req, res) => {
  try {
    // Assume the searchHandler takes query parameters directly now
    let result = await searchHandler(req.query);  // Directly pass query parameters

    // Send response back to client
    res.status(200).send(result);
  } catch (error) {
    // Handle any errors that occur
    res.status(500).send({error: 'An error occurred during search'});
  }
})

app.use(express.static('dist'))

app.get('*', (req, res)=>{
  res.redirect("/404")
})

app.listen(port, () => {
  console.log(`Digital garden running on port ${port}`)
})
