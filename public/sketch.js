let video;
let poseNet;
let skeletons = [];
let poses = [];
let filePicker;
let uploadImg;

function setup() {
  createCanvas(600, 450).parent('canvasContainer');

  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected

  snapshot = select('#addPhoto');
  snapshot.mousePressed(function() {
        submitRequest(poses);
    });

  poseNet.on('pose', function (results) {
    poses = results;
  })
  // Hide the video element, and just show the canvas
  video.hide();

  // For when a new picture is uploaded to the website. 
  // This watches the filePicker element, if there is a change it populates
  // the form with the poses array. 
  filePicker = select('#filePicker');
  filePicker.changed(classifyUpload);
};

function classifyUpload() {
    let files;
    files = filePicker.elt.files;
    
    if (files.length) {
      var reader = new FileReader();
      
      reader.onload = function(e) {
        console.log(e.target.result);
        uploadImg = createImg(e.target.result, uploadImgReady);
        uploadImg.hide();
      };

      reader.readAsDataURL(files[0]);
    }
};

// when the image is ready, then load up poseNet
function uploadImgReady(){
  // assign poseNet
  uploadPoseNet = ml5.poseNet(uploadModelReady);
  // This sets up an event that listens to 'pose' events
  uploadPoseNet.on('pose', function (results) {
      const formName = select('#formName').elt.value;
      const poseName = select('#poseName').elt.value;

      poses = results;
      console.log(poses, formName, poseName);
  });
}

// when poseNet is ready, do the detection
function uploadModelReady() {
  uploadPoseNet.singlePose(uploadImg)
}


// Submits an Ajax request to the backend server.
function submitRequest(results) {
    request = $.ajax({
        type: "post",
        url: "/poses",
        data: JSON.stringify(results),
        dataType: 'JSON',
        contentType: 'application/json'
    });

// Callback handler that will be called on success
request.done(function (response, textStatus, jqXHR){
    buffer = response[1];
    player_name = response[0]['Name'];
    score = response[0]['Score'];

    full_b64 = "data:image/png;base64," + buffer;
    document.getElementById("result_image").src= full_b64;
    document.getElementById("Name").innerHTML = "Name: " + player_name;
    document.getElementById("Score").innerHTML = "Score: " + round(100-((score*5)*100)) + "%";
    });
}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = poses[i].pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(65, 214, 195);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j++) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      stroke(65, 214, 195);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}
