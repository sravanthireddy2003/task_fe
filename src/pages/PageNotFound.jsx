import React from 'react'
import { useNavigate } from 'react-router-dom'
 
const PageNotFound = () => {
 
    const navigate = useNavigate()
  return (
    <div>
 <div>PageNotFound 404</div>
 <button onClick={()=>navigate("/")}> Login </button>
    </div>
   
  )
}
 
export default PageNotFound