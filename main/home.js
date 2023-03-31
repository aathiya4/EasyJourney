
firebase.auth().onAuthStateChanged((user)=>{
    if(!user){
        location.replace("index.html")
    }else{
        document.getElementById("user").innerHTML = "Hello, "+ user.email +", welcome to Easy Journey!"
    }
})


function logout(){
    firebase.auth().signOut()
}


async function searchTrains() {
      // Retrieve the input values
      const from = document.getElementById('from').value;
      const to = document.getElementById('to').value;
      const date = document.getElementById('date').value; 
    
      // Validate the input values
      if (from.trim() === "" || to.trim() === "" || date.trim() === "") {
        alert("Please fill in all the fields.");
        return;
      }
      console.log("in searchtrain()")
    
      // Display loading
      document.getElementById("loading").innerHTML = "<p>Loading...</p>";
      document.getElementById("train_not_found").innerHTML = "";
    
      station_codes = await get_station_code(from, to);
      var from_station_code = station_codes["from_station_code"];
      var to_station_code = station_codes["to_station_code"];
    
      
      const url = `https://railway-w6eh.onrender.com/proxy?from=${from_station_code}&to=${to_station_code}&date=${date}`;
         fetch(url)
          .then(response => response.json())
          .then(data => {
            document.getElementById("loading").innerHTML = " ";
            
            const table = document.getElementById('trains').getElementsByTagName('tbody')[0];
            table.innerHTML = '';
            data = data.data;
            data.forEach(train => {
              const row = table.insertRow(0);
              row.insertCell(0).innerHTML = train.train_base.train_name;
              row.insertCell(1).innerHTML = train.train_base.train_no;
              row.insertCell(2).innerHTML = train.train_base.from_stn_name;
              row.insertCell(3).innerHTML = train.train_base.to_stn_name;
              row.insertCell(4).innerHTML = train.train_base.from_time;
              row.insertCell(5).innerHTML = train.train_base.to_time;
              
              const bookCell = row.insertCell(6);
            const bookBtn = document.createElement('button');
            bookBtn.innerHTML = 'Book';
            bookBtn.className = 'book-btn';
            bookBtn.addEventListener('click', () => bookTrain(from_station_code, to_station_code));
            bookCell.appendChild(bookBtn);
            });
          })
          .catch(error =>  {
            console.log(error) ;
            document.getElementById("loading").innerHTML = " ";
            document.getElementById("train_not_found").innerHTML = "<p>No train found. Please check if you entered the correct location spelling or correct station name. </p>";
         } 
         );
        }

 
async function get_station_code(from, to){
    
  var returnedObject = {};

      console.log("in get_station_code()");
      const response = await fetch("station_code.json") //Taken from https://gist.github.com/apsdehal/11393083
      const data = await response.json();

        stn_data= data.data;
        var to_station_code="";
    var from_station_code="";
        var found_from_flag = false;
        var found_to_flag = false;
        
        for (var i=0 ; i < stn_data.length ; i++)
        {
            
            if (stn_data[i]['name'].toLowerCase() == from.toLowerCase()) {
              from_station_code = stn_data[i]['code'];
              returnedObject["from_station_code"] = stn_data[i]['code'];
                found_from_flag = true;
            }
            if (stn_data[i]['name'].toLowerCase() == to.toLowerCase()) {
              to_station_code = stn_data[i]['code'];
              returnedObject["to_station_code"] = stn_data[i]['code'];
              found_to_flag = true;
            }
            if(found_from_flag && found_to_flag){
              break;
            }
        }

         return returnedObject;
          
}


function bookTrain(from_station_code, to_station_code) {
  const date = document.getElementById('date').value; 
  window.open(`https://www.confirmtkt.com/rbooking-d/trains/from/${from_station_code}/to/${to_station_code}/${formatDate(date)}`, "_blank");
}

function formatDate(dateStr)
{
   var dArr = dateStr.split("-");  // ex input: "2010-01-18"
   return dArr[2]+ "-" +dArr[1]+ "-" +dArr[0]; //ex output: "18/01/10"
}

 

const pageLength = 5; // number of objects per page

let lon; // place longitude
let lat; // place latitude

let offset = 0; // offset from first object in the list
let count; // total objects count
const apiKey = "5ae2e3f221c38a28845f05b6343a87ff5914412de42e48fca06e372c";


function apiGet(method, query) {
  return new Promise(function(resolve, reject) {
    var otmAPI =
      "https://api.opentripmap.com/0.1/en/places/" +
      method +
      "?apikey=" +
      apiKey;
    if (query !== undefined) {
      otmAPI += "&" + query;
    }
    fetch(otmAPI)
      .then(response => response.json())
      .then(data => resolve(data))
      .catch(function(err) {
        console.log("Fetch Error :-S", err);
      });
  });
}

function get_tourist_places(){
   
    let name = document.getElementById('to').value;
    apiGet("geoname", "name=" + name).then(function(data) {
      let message = "We cannot find "+name+" in our database to display tourist spots!";
      if (data.status == "OK") {
        message = "Here are some tourists spots we found in " + data.name + " (within 5kms radius)! Click on the names of the destinations to know more about them. "; //+ ", " + getCountryName(data.country);
        lon = data.lon;
        lat = data.lat;
        firstLoad();
      }
      document.getElementById("tourist_places").innerHTML = `${message}`;
    });
 }


 function firstLoad() {
  var count = 0;
  apiGet(
    "radius",
    // `radius=1000&limit=${pageLength}&offset=${offset}&lon=${lon}&lat=${lat}&rate=2&format=count`
    `radius=5000&lon=${lon}&lat=${lat}&rate=2&format=count`
  ).then(function(data) {
    count = data.count;
    offset = 0;
    document.getElementById(
      "tourist_places"
    ).innerHTML += `<p>${count} places found.</p>`;
    loadList();
  });

}

function loadList() {
  apiGet(
    "radius",
    // `radius=1000&limit=${pageLength}&offset=${offset}&lon=${lon}&lat=${lat}&rate=2&format=json`
    `radius=5000&lon=${lon}&lat=${lat}&rate=2&format=json`
    ).then(function(data) {
    let list = document.getElementById("places-list");
    list.innerHTML = "";
    data.forEach(item => list.appendChild(createListItem(item)));
    document.getElementById("poi").innerHTML = ""; //removing previous image if any
  });
}

function createListItem(item) {
  let a = document.createElement("a");
  a.className = "list-group-item list-group-item-action";
  a.setAttribute("data-id", item.xid);
  a.innerHTML = `<h5 class="list-group-item-heading">${item.name}</h5>
            <p class="list-group-item-text"></p>`;

  a.addEventListener("click", function() {
    document.querySelectorAll("#places-list a").forEach(function(item) {
      item.classList.remove("active");
    });
    this.classList.add("active");
    let xid = this.getAttribute("data-id");
    apiGet("xid/" + xid).then(data => onShowPOI(data));
  });
  return a;
}

function onShowPOI(data) {
  let poi = document.getElementById("poi");
  poi.innerHTML = "";
  if (data.preview) {
    poi.innerHTML += `<img id="image" src="${data.preview.source}">`;
  }
  poi.innerHTML += data.wikipedia_extracts
    ? data.wikipedia_extracts.html
    : data.info
    ? data.info.descr
    : "No description";

  poi.innerHTML += `<p><a target="_blank" href="${data.otm}">Show more at OpenTripMap</a></p>`;
}