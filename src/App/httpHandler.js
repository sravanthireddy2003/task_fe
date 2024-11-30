const serverURL = "http://localhost:4000";

export function httpPostService(url, data) {
    const apiURL = `${serverURL}/${url}` //http://localhost:5000/api/login
    return fetch(`${apiURL}`, {
        method: 'POST',
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((data) => {
            return data
        })
        .catch(err => console.log(err))
}

export function httpDeleteService(url, data) {
    const apiURL = `${serverURL}/${url}` 
    return fetch(`${apiURL}`, {
        method: 'Delete',
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((data) => {
            return data
        })
        .catch(err => console.log(err))
}

export function httpPatchService(url, data) {
    const apiURL = `${serverURL}/${url}` 
    return fetch(`${apiURL}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((data) => {
            return data
        })
        .catch(err => console.log(err))
}

  
  // HTTP PUT Service function
  export function httpPutService(url, data) {
      const apiURL = `${serverURL}/${url}`; 
      return fetch(apiURL, {
          method: 'PUT',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
      })
      .then((response) =>response.json())
      .then((data)=>{
        return data
      })
      .catch(err =>
          console.error(err)); 
  }
  


// export function httpUploadService(url, data) {
//     const apiURL = `${serverURL}/${url}` //http://localhost:5000/api/login
//     return fetch(`${apiURL}`, {
//         method: 'POST',
//         // headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: data
//     })
//         .then((response) => response.json())
//         .then((data) => {
//             return data
//         })
//         .catch(err => console.log(err))
// }

export function httpGetService(url) {
    const apiURL = `${serverURL}/${url}`
    return fetch(`${apiURL}`)
        .then((response) => response.json())
        .then((data) => {
            // console.log(data)
            return data
        })
        .catch(err => console.log(err))
}