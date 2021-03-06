// Copyright 2015 Alex Ryan
// (P.S. please don't judge how awful this JavaScript looks, it was compiled
// from much prettier TypeScript. TS is awesome!)

/// <reference path="classAddRemove.ts" />

class Interval {

    // This is what we use when a place isn't open at all on a particular day
    static none: [Interval] = [new Interval(-1, -1)];

    private openingTime: number;
    private closingTime: number;

    constructor(open: number, close: number) {
        this.openingTime = open;
        this.closingTime = close;
    }

    // 1100
    getOpen(): number {
        return this.openingTime;
    }

    // "11:00am"
    getOpenString(): string {
        return stringifyHour(this.openingTime);
    }

    // 2530
    getClose(): number {
        return this.closingTime;
    }

    // "1:30am"
    getCloseString(): string {
        return stringifyHour(this.closingTime);
    }

    // [1100, 2530]
    getInterval(): [number, number] {
        return [this.openingTime, this.closingTime];
    }

    // "11:00am to 1:30am"
    getIntervalString(): string {
        if (this.getOpen() == 0 && this.getClose() == 2400) return "All day";
        return this.getOpenString() + " to " + this.getCloseString();
    }
}

class Place {
    private name: string;
    private isOnCampus: boolean;
    private Sunday: [Interval];
    private Monday: [Interval];
    private Tuesday: [Interval];
    private Wednesday: [Interval];
    private Thursday: [Interval];
    private Friday: [Interval];
    private Saturday: [Interval];

    constructor(name: string, isOnCampus: boolean, Sunday: [Interval], Monday: [Interval], Tuesday: [Interval], Wednesday: [Interval], Thursday: [Interval], Friday: [Interval], Saturday: [Interval]) {
        this.name = name;
        this.isOnCampus = isOnCampus;
        this.Sunday = Sunday;
        this.Monday = Monday;
        this.Tuesday = Tuesday;
        this.Wednesday = Wednesday;
        this.Thursday = Thursday;
        this.Friday = Friday;
        this.Saturday = Saturday;
    }

    getName(): string {
        return this.name;
    }

    getHoursForDay(d: number): [Interval] {
        switch (d) {
            case 0: return this.Sunday;
            case 1: return this.Monday;
            case 2: return this.Tuesday;
            case 3: return this.Wednesday;
            case 4: return this.Thursday;
            case 5: return this.Friday;
            case 6: return this.Saturday;
        }
    }

    getHoursForYesterday(): [Interval] {
        return this.getHoursForDay(((new Date()).getDay() - 1 + 7) % 7);
    }

    getHoursForToday(): [Interval] {
        return this.getHoursForDay((new Date()).getDay());
    }

    getHoursForTomorrow(): [Interval] {
        return this.getHoursForDay(((new Date()).getDay() + 1) % 7);
    }

    /* This function returns true if the Place is open right now, and
       false otherwise. */
    isOpenNow(): boolean {
        var time: number = getExtendedTime();

        // If we're dealing with 2500 (for example) we need to be looking at
        // yesterday's open intervals, not today's.
        if (time > 2400) {
            var openings: [Interval] = this.getHoursForYesterday();
        } else {
            var openings: [Interval] = this.getHoursForToday();
        }

        for (var i=0; i<openings.length; i++) {
            var x: Interval = openings[i];
            if ((time > x.getOpen()) && (time < x.getClose())) return true;
        }
        return false;
    }
}

/* This function returns a time between 0500 and 2859.
   It seems that nothing is ever open around 5am, so I thought that
   would be a good cutoff time for the day change. */
function getExtendedTime(): number {
    var date: Date = new Date();
    var hour: number = date.getHours();
    var minute: number = date.getMinutes();
    // I'm arbitrarily deciding that any times before 4:59am belong to the previous day.
    if (hour < 5) hour += 24;
    var time: number = (hour * 100) + minute;
    return time;
}

/* This function takes a string and inserts a colon
   two characters from the end.  "1030" -> "10:30" */
function insertColon(time: string): string {
    return time.slice(0, -2) + ":" + time.slice(-2, time.length);
}

/* This function attempts to pretty-print a number between 0000 and 2900
  as an hour string.
  1030 -> "10:30am"
  2400 -> "midnight"
  2545 -> "1:45am"  */
function stringifyHour(hour: number): string {
    var output: string = "";
    if ((hour == 2400) || (hour == 0)) {
        output = "midnight";
    } else if (hour == 1200) {
        output = "noon";
    } else if (hour > 2400) {
        hour -= 2400;
        if (hour < 100) hour += 1200;
        output += insertColon(hour.toString()) + "am";
    } else if (hour > 1200) {
        hour -= 1200;
        if (hour < 100) hour += 1200;
        output += insertColon(hour.toString()) + "pm";
    } else {
        if (hour < 100) hour += 1200;
        output = insertColon(hour.toString()) + "am";
    }
    return output;
}

/* This function attempts to pretty-print all the upcoming open times for a
   given Place. If there are none remaining today, it prints tomorrow's. */
function printUpcomingOpenings(place: Place): string {

    var hours = place.getHoursForToday();
    var time: number = getExtendedTime();
    var output: string = "";

    for (var i=0; i<hours.length; i++) {
        var x: Interval = hours[i];
        // Add all of the intervals that haven't ended yet to the output
        if (time < x.getClose()) {
            output += x.getIntervalString() + " and ";
        }
    }
    // If there are no intervals today, or they all already ended,
    // let's show what's open tomorrow.
    if ((hours == Interval.none) || (output == "")) {
        var hours = place.getHoursForTomorrow();
        if (hours == Interval.none) return "closed for today and tomorrow";
        output += "[Tomorrow] "
        for (var i=0; i<hours.length; i++) {
            var x: Interval = hours[i];
            output += x.getIntervalString() + " and ";
        }
    }
    return output.slice(0, -5);  //remove that annoying last " and "
}


// name, isOnCampus, Sunday, Monday,<...>, Saturday
var places : [Place] = [
    new Place("Open Kitchen", true,
    /*Sunday*/      [new Interval(1000, 1400)],
    /*Monday*/      [new Interval(730, 1130), new Interval(1500, 1900)],
    /*Tuesday*/     [new Interval(730, 1130), new Interval(1500, 1900)],
    /*Wednesday*/   [new Interval(730, 1130), new Interval(1500, 1900)],
    /*Thursday*/    [new Interval(730, 1130), new Interval(1500, 1900)],
    /*Friday*/      [new Interval(730, 1130), new Interval(1500, 1900)],
    /*Saturday*/    [new Interval(1000, 1400)]
                ),
    new Place("Chandler (Breakfast)", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(700, 1000)],
    /*Tuesday*/     [new Interval(700, 1000)],
    /*Wednesday*/   [new Interval(700, 1000)],
    /*Thursday*/    [new Interval(700, 1000)],
    /*Friday*/      [new Interval(700, 1000)],
    /*Saturday*/    Interval.none
                ),
    new Place("Chandler (Sushi)", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(1100, 1330)],
    /*Tuesday*/     [new Interval(1100, 1330)],
    /*Wednesday*/   [new Interval(1100, 1330)],
    /*Thursday*/    [new Interval(1100, 1330)],
    /*Friday*/      [new Interval(1100, 1330)],
    /*Saturday*/    Interval.none
                ),
    new Place("Chandler (Lunch)", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(1100, 1430)],
    /*Tuesday*/     [new Interval(1100, 1430)],
    /*Wednesday*/   [new Interval(1100, 1430)],
    /*Thursday*/    [new Interval(1100, 1430)],
    /*Friday*/      [new Interval(1100, 1430)],
    /*Saturday*/    Interval.none
                ),
    new Place("Chandler (Pizza/Grill)", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(1100, 1530)],
    /*Tuesday*/     [new Interval(1100, 1530)],
    /*Wednesday*/   [new Interval(1100, 1530)],
    /*Thursday*/    [new Interval(1100, 1530)],
    /*Friday*/      [new Interval(1100, 1530)],
    /*Saturday*/    Interval.none
                ),
    new Place("South House Kitchens", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(1130, 1300)],
    /*Tuesday*/     [new Interval(1130, 1300)],
    /*Wednesday*/   [new Interval(1130, 1300)],
    /*Thursday*/    [new Interval(1130, 1300)],
    /*Friday*/      [new Interval(1130, 1300)],
    /*Saturday*/    Interval.none
                ),
    new Place("Red Door", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(730, 1730)],
    /*Tuesday*/     [new Interval(730, 1730)],
    /*Wednesday*/   [new Interval(730, 1730)],
    /*Thursday*/    [new Interval(730, 1730)],
    /*Friday*/      [new Interval(730, 1730)],
    /*Saturday*/    Interval.none
                ),
    new Place("Broad Cafe", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(745, 1430)],
    /*Tuesday*/     [new Interval(745, 1430)],
    /*Wednesday*/   [new Interval(745, 1430)],
    /*Thursday*/    [new Interval(745, 1430)],
    /*Friday*/      [new Interval(745, 1430)],
    /*Saturday*/    Interval.none
                ),
    new Place("House Dinner", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(1730, 1900)],
    /*Tuesday*/     [new Interval(1730, 1900)],
    /*Wednesday*/   [new Interval(1730, 1900)],
    /*Thursday*/    [new Interval(1730, 1900)],
    /*Friday*/      [new Interval(1700, 1830)],
    /*Saturday*/    Interval.none
                ),
    new Place("Chouse (Grill)", true,
    /*Sunday*/      [new Interval(2200, 2530)],
    /*Monday*/      [new Interval(2200, 2530)],
    /*Tuesday*/     [new Interval(2200, 2530)],
    /*Wednesday*/   [new Interval(2200, 2530)],
    /*Thursday*/    [new Interval(2200, 2530)],
    /*Friday*/      Interval.none,
    /*Saturday*/    Interval.none
                ),
    new Place("Chouse", true,
    /*Sunday*/      [new Interval(2200, 2600)],
    /*Monday*/      [new Interval(2200, 2600)],
    /*Tuesday*/     [new Interval(2200, 2600)],
    /*Wednesday*/   [new Interval(2200, 2600)],
    /*Thursday*/    [new Interval(2200, 2600)],
    /*Friday*/      Interval.none,
    /*Saturday*/    Interval.none
                ),
    new Place("C-Store", true,
    /*Sunday*/      [new Interval(1200, 2500)],
    /*Monday*/      [new Interval(1030, 2500)],
    /*Tuesday*/     [new Interval(1030, 2500)],
    /*Wednesday*/   [new Interval(1030, 2500)],
    /*Thursday*/    [new Interval(1030, 2500)],
    /*Friday*/      [new Interval(1030, 2500)],
    /*Saturday*/    [new Interval(1100, 2000)]
                ),
    new Place("Package Annex", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(900, 1100), new Interval(1200, 1600), new Interval(2030, 2230)],
    /*Tuesday*/     [new Interval(900, 1100), new Interval(1200, 1600), new Interval(2030, 2230)],
    /*Wednesday*/   [new Interval(900, 1100), new Interval(1200, 1600), new Interval(2030, 2230)],
    /*Thursday*/    [new Interval(900, 1100), new Interval(1200, 1600), new Interval(2030, 2230)],
    /*Friday*/      [new Interval(900, 1100), new Interval(1200, 1600), new Interval(2030, 2230)],
    /*Saturday*/    Interval.none
                ),
    new Place("Gym", true,
    /*Sunday*/      [new Interval(800, 2000)],
    /*Monday*/      [new Interval(600, 2230)],
    /*Tuesday*/     [new Interval(600, 2230)],
    /*Wednesday*/   [new Interval(600, 2230)],
    /*Thursday*/    [new Interval(600, 2230)],
    /*Friday*/      [new Interval(600, 2230)],
    /*Saturday*/    [new Interval(800, 2000)]
                ),
    new Place("Bookstore", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(830, 1730)],
    /*Tuesday*/     [new Interval(830, 1730)],
    /*Wednesday*/   [new Interval(830, 1730)],
    /*Thursday*/    [new Interval(830, 1730)],
    /*Friday*/      [new Interval(830, 1730)],
    /*Saturday*/    Interval.none
                ),
]

var libraries = [
    // Not quite right, there's multiple intervals in one day
    new Place("SFL (WIP)", true,
    /*Sunday*/      [new Interval(900, 2400)],
    /*Monday*/      [new Interval(0, 2400)],
    /*Tuesday*/     [new Interval(0, 2400)],
    /*Wednesday*/   [new Interval(0, 2400)],
    /*Thursday*/    [new Interval(0, 2400)],
    /*Friday*/      [new Interval(0, 2700)],
    /*Saturday*/    [new Interval(900, 2600)]
                ),
    new Place("Millikan", true,
    /*Sunday*/      [new Interval(900, 2400)],
    /*Monday*/      [new Interval(800, 2400)],
    /*Tuesday*/     [new Interval(800, 2400)],
    /*Wednesday*/   [new Interval(800, 2400)],
    /*Thursday*/    [new Interval(800, 2400)],
    /*Friday*/      [new Interval(800, 2400)],
    /*Saturday*/    [new Interval(900, 2400)]
                ),
    new Place("Dabney", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(800, 1700)],
    /*Tuesday*/     [new Interval(800, 1700)],
    /*Wednesday*/   [new Interval(800, 1700)],
    /*Thursday*/    [new Interval(800, 1700)],
    /*Friday*/      [new Interval(800, 1700)],
    /*Saturday*/    Interval.none
                ),
    new Place("Cahill", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(800, 1700)],
    /*Tuesday*/     [new Interval(800, 1700)],
    /*Wednesday*/   [new Interval(800, 1700)],
    /*Thursday*/    [new Interval(800, 1700)],
    /*Friday*/      [new Interval(800, 1700)],
    /*Saturday*/    Interval.none
                ),
    new Place("Geology", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(800, 1700)],
    /*Tuesday*/     [new Interval(800, 1700)],
    /*Wednesday*/   [new Interval(800, 1700)],
    /*Thursday*/    [new Interval(800, 1700)],
    /*Friday*/      [new Interval(800, 1700)],
    /*Saturday*/    Interval.none
                ),
    new Place("Archives", true,
    /*Sunday*/      Interval.none,
    /*Monday*/      [new Interval(800, 1700)],
    /*Tuesday*/     [new Interval(800, 1700)],
    /*Wednesday*/   [new Interval(800, 1700)],
    /*Thursday*/    [new Interval(800, 1700)],
    /*Friday*/      [new Interval(800, 1700)],
    /*Saturday*/    Interval.none
                ),
]

/* This function recomputes the current time and updates the DOM */
function redrawCurrentTime(): void {
    var date: Date = new Date();
    var time: number = (date.getHours() * 100) + date.getMinutes();
    var timeString: string = "Current time is: " + stringifyHour(time);
    var currentTime = document.getElementById("currentTime");
    currentTime.innerHTML = timeString;
}

/* This function recomputes which places are open and closed and
   when their next opening times are, and updates the DOM */
function redrawPlaces(): void {
    var openPlaces = document.getElementById("openPlaces");
    var closedPlaces = document.getElementById("closedPlaces");
    openPlaces.innerHTML = "";
    closedPlaces.innerHTML = "";

    /* Determine which group of locations should be displayed */
    var whichPlaces = <HTMLInputElement>document.getElementById("whichPlaces");
    var placeGroup;
    switch (whichPlaces["elements"].placeType.value) {
        case "misc":
            placeGroup = places;
            break;

        case "lib":
            placeGroup = libraries;
            break;

        default:
            placeGroup = places;
            break;
    }

    for (var i=0; i<placeGroup.length; i++) {
        var place: Place = placeGroup[i];

        var row = document.createElement("tr");
        var name = document.createElement("td");
        var spacer = document.createElement("td");
        var hours = document.createElement("td");
        var nametext = document.createTextNode(place.getName());
        var hourstext = document.createTextNode(printUpcomingOpenings(place));
        name.appendChild(nametext);
        hours.appendChild(hourstext);
        row.appendChild(name);
        row.appendChild(spacer);
        row.appendChild(hours);

        if (place.isOpenNow()) {
            addClass(row, "open");
            openPlaces.appendChild(row);
        } else {
            addClass(row, "closed");
            closedPlaces.appendChild(row);
        }
    }
}

/* This is the "main" function of sorts, it gets called when the page loads.
   It sets the places list and time to refresh every 5 seconds. */
window.onload = function() {
    // Populate the Current Time field
    redrawCurrentTime();
    setInterval(redrawCurrentTime, 5000);

    // Populate the list of places
    redrawPlaces();
    setInterval(redrawPlaces, 5000);
}
