const video = document.getElementById('video')

// Promise.all([
//     //faceapi.nets.tinyFaceDetector.loadFromUri('http://localhost:8000/models')
//     faceapi.nets.tinyFaceDetector.loadFromUri('/models')
// // localhost:8000/models
//     //faceapi.nets.tinyFaceDetector.loadFromUri('https://www.sample.com/face_recognition/final/models')
// ]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { audio: false, video: {facingMode: "user"} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
  
}
startVideo();
// video.addEventListener('play', () => {
//     const canvas = faceapi.createCanvasFromMedia(video)
//     document.body.append(canvas)
//     // const displaySize = { width: video.width, height: video.height }
//     // faceapi.matchDimensions(canvas, displaySize)
//     setInterval(async () => {
//       const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
//       if ( detections.length < 1 )
//         refresh();
//     }, 1000)
//   })
