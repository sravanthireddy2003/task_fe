const serverURL =`${import.meta.env.VITE_SERVERURL}`;

export function httpPostService(url, data) {
    const apiURL = `${serverURL}/${url}`
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

const handleError = (error) => {
  if (error.response) {
    // Server responded with a status code that falls out of 2xx
    return Promise.reject(error.response.data?.message || error.message);
  } else if (error.request) {
    // Request was made but no response received
    return Promise.reject('No response from server');
  } else {
    // Something happened in setting up the request
    return Promise.reject(error.message);
  }
};