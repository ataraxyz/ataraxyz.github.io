const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { audio: false, video: {facingMode: "user"} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
  
}
// startVideo();
video.addEventListener('play', () => {
    // const canvas = faceapi.createCanvasFromMedia(video)
    // document.body.append(canvas)
    // const displaySize = { width: video.width, height: video.height }
    // faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
      if ( detections.length < 1 )
        refresh();
      else
        setSpeed( 50 + detections[0]['expressions']['happy'] * 200 );
    }, 100)
  })
