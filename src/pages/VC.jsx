import React from 'react';

const VC = () => {
  return (
    <div>
      <iframe
        width="560"
        height="315"
        // src="https://www.youtube.com/embed/lxYikfwyXcQ"
        // src="https://www.youtube.com/embed/zfxJxAB2dOQ"
        src="https://www.youtube.com/embed/PISwEmeQFmA"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VC;



// import React from "react";
// import ReactDom from 'react-dom/client';
// import './vc.css';
// import App from './App';
// import ZoomContext from './context/zoom-context';
// import {dotConfig} from './dotCOnfig';
// import ZoomVideo from '@zoom/videosdk';


// let meetingArgs={...devConfig};

// const getToken=async(options)=>{
// let response =await fetch('/generate',options).then(response=response.json());
// return response;
// }

// if(!meetingArgs.signature && meetingArgs.topic){
//     const requestOptions={
//         method:'Post',
//         headers:{'Content-Type':application/json},
//         body:JSON.stringify(meetingArgs)
//     }
//     getToken(requestOptions).then(res=meetingArgs.signature=res)
// }

// const client=ZoomVideo.createClient();

// const root=ReactDom.createRoot(document.getElementById('root'));

// root.render(
//     <React.StrictMode>
//         <ZoomContext.Provider value={client}>
//             <App meetings={meetings}/>
//         </ZoomContext.Provider>
//     </React.StrictMode>
// );

