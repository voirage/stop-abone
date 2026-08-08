const axios = require('axios');
const formData = new URLSearchParams();
formData.append('username', 'jeanluc-final@gmail.com');
formData.append('password', 'Password123!');

axios.post('http://localhost:8000/token', formData, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
}).then(res => {
  console.log("Success:", res.data);
}).catch(err => {
  console.error("Error:", err.response ? err.response.status : err.message);
});
