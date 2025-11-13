// one  -> 1..1   (exactly one)
// lone -> 0..1   (zero or one, "lone" = "less or one")
// some -> 1..*   (one or more)
// set  -> 0..*   (zero or more, default if not specified)

enum Boolean { True, False }

abstract sig User {  
  var has_selected: lone Path,
  var currentLocation: one Location,
  var current_trip: lone Trip,
  var trip_origin: lone Location,     
  var trip_destination: lone Location,
  // paths suggested by the system after origin/dest selection 
  // (based only on origin and destination, without anything else for simplicity)
  var suggested_paths: set Path
}

// Guest and LoggedInUser are DISJOINT from each other
sig Guest extends User {}

// LoggedInUser has completed trips to keep history of past trips
sig LoggedInUser extends User {
  var completed_trips: set Trip,
}

// trips are created dynamically when users start them
var sig Trip {
  var bike_path: lone Path,
  var has_started: one Boolean,
  var has_finished: one Boolean,
  // track which segment the user is on
  var current_segment: lone PathSegment
}

// "in": subsets and can be "var", in general they are not disjoint
// but in our case, ActiveTrip and CompletedTrip are disjoint (fact liveTripConsistency)
var sig ActiveTrip, CompletedTrip in Trip {}

sig Path {
   segments: some PathSegment,
   origin: one Location,
   destination: one Location
}

// we assumed that it is something like "Piola"
sig Location {}

sig PathSegment {
  segmentLocation: one Location,
  nextSegment: lone PathSegment // with the fact we assure it is not a loop
}

//  the guide ("https://haslab.github.io/formal-software-design/overview/index.html")
//  says "if it is a normal first-order formula that constraints 
//  the values of the sets and relations in the state, then it is only 
//  required to hold in the initial state of every trace"
//  so init fact is only for initial state constraints I guess

fact init {
  // "#" = CARDINALITY (number of elements in a set)
  #LoggedInUser = 1
  #Guest = 1
  #Path = 2

  // no means zero elements in the set
  no has_selected
  no completed_trips
  no trip_origin
  no trip_destination
  no suggested_paths
  no current_trip
  no Trip
  no ActiveTrip
  no CompletedTrip
}

// each PathSegment must belong to at least one Path
fact segHasPath { 
   all s: PathSegment | some p: Path | s in p.segments 
}

// The segments form a sequence without cycles and connect origin → destination
fact pathStructure {
  all p: Path | {
    // origin and destination must be different
    p.origin != p.destination

    // there must be a first segment starting at origin (no predecessor inside p.segments)
    some s: p.segments | s.segmentLocation = p.origin and 
      (no s2: p.segments | s2.nextSegment = s)

    // there must be a last segment ending at destination
    some s: p.segments | s.segmentLocation = p.destination and 
      no s.nextSegment

    // all segments must be connected (next stays inside p.segments)
    all s: p.segments | (some s.nextSegment) implies (s.nextSegment in p.segments)

    // no cycle
    // "^" is the transitive closure, basically it is s.nextSegment.nextSegment.nextSegment.....
    all s: p.segments | s not in s.^nextSegment

    // path must be connected from origin to destination
    let first = {s: p.segments | s.segmentLocation = p.origin and 
                  no s2: p.segments | s2.nextSegment = s} |
    let reachable = first.*nextSegment |
    p.segments = reachable
  }
}

// a Trip is in ActiveTrip or CompletedTrip if and only if it has an associated bike_path
// this means: a trip exists in the system only if it has a path
// (for LoggedInUser's history, completed trips keep their paths)
fact liveTripConsistency {
   always all t: Trip | (t in ActiveTrip + CompletedTrip) iff some bike_path[t]
}

// each ActiveTrip has exactly one User currently taking it
// each User has at most one current_trip (which must be active)
// completed trips are NOT current_trip, so they don't mess with new trip selection
fact currentTripConsistency {
  always (
    all t: ActiveTrip | one u: User | u.current_trip = t
    and all u: User | lone u.current_trip
    and all u: User | some u.current_trip implies (
      u.current_trip in ActiveTrip
      and has_selected[u] = bike_path[u.current_trip]
    )
  )
}

// Completed trips are disjoint from active trips
fact completedTripsDisjoint {
  always no (ActiveTrip & CompletedTrip)
}

// all trips must have their boolean flags properly set
fact tripBooleanConsistency {
  always all t: Trip | one has_started[t] and one has_finished[t]
}

// ' indicates the value of relation X in the next state
// used in POSTCONDITIONS to specify how relations change
// to define a pred, it would be best from what i understood to define it according to this scheme:
// 1. PRECONDITIONS (guard): when the event can occur
// 2. POSTCONDITIONS (effect): how mutable relations change
// 3. FRAME CONDITIONS: which relations do not change (stay the same)
// the guide says that if we don't specify what happens to a mutable relation, it can
// change freely. To say that it does not need to change we must write: X' = X

// STEP 1: User selects origin and destination
// note that the origin must be the user's current location for simplicity
// (in reality, it can browse to different locations, but it cannot start the trip (if in a different location 
// from the origin of the bike path))
pred selectOriginDestination[u: User, dest: Location] {
  // PRECONDITIONS
  // the user must not have already selected origin/destination
  no u.trip_origin
  no u.trip_destination
  no u.current_trip
  // destination must be different from source
  u.currentLocation != dest
  
  // POSTCONDITIONS
  // the origin is always the current location
  trip_origin' = trip_origin + (u -> u.currentLocation)
  trip_destination' = trip_destination + (u -> dest)
  
  // FRAME CONDITIONS, all other mutable relations do not change
  Trip' = Trip
  ActiveTrip' = ActiveTrip
  CompletedTrip' = CompletedTrip
  has_selected' = has_selected
  currentLocation' = currentLocation
  current_trip' = current_trip
  completed_trips' = completed_trips
  bike_path' = bike_path
  has_started' = has_started
  has_finished' = has_finished
  current_segment' = current_segment
  suggested_paths' = suggested_paths
}

// STEP 2: System suggests paths based on origin and destination
// the system (not shown here, but in reality the system suggests 
// the bike_path to the user based on the rating, etc. For simplicity, here 
// nothing of that, but pretend that the alloy6 model suggests a path to the user)
pred suggestPaths[u: User] {
  // PRECONDITIONS
  some u.trip_origin
  some u.trip_destination
  no u.suggested_paths
  no u.has_selected
  
  // POSTCONDITIONS
  // find all paths that match the origin and destination
  let matchingPaths = {p: Path | p.origin = u.trip_origin and p.destination = u.trip_destination} |
  some matchingPaths and
  suggested_paths' = suggested_paths + (u -> matchingPaths)
  
  // FRAME CONDITIONS
  Trip' = Trip
  ActiveTrip' = ActiveTrip
  CompletedTrip' = CompletedTrip
  has_selected' = has_selected
  currentLocation' = currentLocation
  current_trip' = current_trip
  completed_trips' = completed_trips
  bike_path' = bike_path
  has_started' = has_started
  has_finished' = has_finished
  current_segment' = current_segment
  trip_origin' = trip_origin
  trip_destination' = trip_destination
}

// STEP 3: User selects one path from suggestions
pred userSelectsPath[u: User, p: Path] {
  // PRECONDITIONS
  // the path must be among the suggested ones
  p in u.suggested_paths
  // the user must not have already selected a path
  no u.has_selected
  // the user must not have an ongoing trip
  no u.current_trip
  
  // POSTCONDITIONS
  // add the new selection
  has_selected' = has_selected + (u -> p)

  // FRAME CONDITIONS
  Trip' = Trip
  ActiveTrip' = ActiveTrip
  CompletedTrip' = CompletedTrip
  currentLocation' = currentLocation
  current_trip' = current_trip
  completed_trips' = completed_trips
  bike_path' = bike_path
  has_started' = has_started
  has_finished' = has_finished
  trip_origin' = trip_origin
  trip_destination' = trip_destination
  suggested_paths' = suggested_paths
}

// STEP 4: Start the trip
pred startTrip[u: User] {
  // PRECONDITIONS
  // the user must have selected a path
  some u.has_selected
  // the user must not have an ongoing trip
  no u.current_trip
  // the user must be at the origin of the selected route
  u.currentLocation = u.trip_origin

  // find the first segment of the selected path
  let firstSeg = {s: u.has_selected.segments | 
    s.segmentLocation = u.trip_origin and
    no s2: u.has_selected.segments | s2.nextSegment = s} |
  
  // POSTCONDITIONS
  // create a new trip t that doesn't exist in the current state (it is like a trip that exist in the future, aka new)
  some t: Trip' - Trip |
    Trip' = Trip + t
    and ActiveTrip' = ActiveTrip + t
    and bike_path' = bike_path + (t -> u.has_selected)
    and has_started' = has_started + (t -> True)
    and has_finished' = has_finished + (t -> False)
    and current_trip' = current_trip + (u -> t)
    and current_segment' = current_segment + (t -> firstSeg)

  // FRAME CONDITIONS
  has_selected' = has_selected
  currentLocation' = currentLocation
  completed_trips' = completed_trips
  CompletedTrip' = CompletedTrip
  trip_origin' = trip_origin
  trip_destination' = trip_destination
  suggested_paths' = suggested_paths
}

// STEP 5: move along path segment by segment
// if two path segments are in the same location, the user always stays in that location
// but if the next path segment is in a different location, the user moves accordingly
pred moveAlongPath[u: User] {
  // PRECONDITIONS
  some u.current_trip
  u.current_trip in ActiveTrip
  has_started[u.current_trip] = True
  has_finished[u.current_trip] = False
  // it must not have arrived yet (must have a next segment)
  some current_segment[u.current_trip]
  some current_segment[u.current_trip].nextSegment

  // find the current and next segment
  let currSeg = current_segment[u.current_trip] |
  let nextSeg = currSeg.nextSegment |
  
  // POSTCONDITIONS
  // update current segment
  current_segment' = current_segment - (u.current_trip -> PathSegment) + (u.current_trip -> nextSeg)
  // update user location to the next segment's location
  // if two path segments are in the same location, the user always remains in that location
  and currentLocation' = currentLocation - (u -> Location) + (u -> nextSeg.segmentLocation)

  // FRAME CONDITIONS
  Trip' = Trip
  ActiveTrip' = ActiveTrip
  CompletedTrip' = CompletedTrip
  has_selected' = has_selected
  current_trip' = current_trip
  completed_trips' = completed_trips
  bike_path' = bike_path
  has_started' = has_started
  has_finished' = has_finished
  trip_origin' = trip_origin
  trip_destination' = trip_destination
  suggested_paths' = suggested_paths
}

// STEP 6: once you reach your destination the trip ends
pred stopTrip[u: User] {
  // PRECONDITIONS
  // The user must have an ongoing trip
  some u.current_trip
  // The trip must be active and already started
  u.current_trip in ActiveTrip
  has_started[u.current_trip] = True
  // must have arrived at its destination
  u.currentLocation = u.trip_destination
  // must be on a segment that has no next (last segment)
  no current_segment[u.current_trip].nextSegment

  // POSTCONDITIONS
  // Mark the trip as finished, but it remains active and current_trip
  has_finished' = has_finished - (u.current_trip -> Boolean) + (u.current_trip -> True)

  // FRAME CONDITIONS
  Trip' = Trip
  ActiveTrip' = ActiveTrip
  CompletedTrip' = CompletedTrip
  has_selected' = has_selected
  currentLocation' = currentLocation
  current_trip' = current_trip
  completed_trips' = completed_trips
  bike_path' = bike_path
  has_started' = has_started
  trip_origin' = trip_origin
  trip_destination' = trip_destination
  suggested_paths' = suggested_paths
  current_segment' = current_segment
}

// STEP 7: finalize the trip for loggedInUser or guest
pred finalizeTrip[u: User] {
  // PRECONDITIONS
  // the user must have an ongoing trip
  some u.current_trip
  // the trip must be active and already stopped (finished=True)
  u.current_trip in ActiveTrip
  has_finished[u.current_trip] = True

  let t = u.current_trip |
  
  // POSTCONDITIONS
  // the trip exits from active trips
  ActiveTrip' = ActiveTrip - t
  // the user no longer has a current_trip
  and current_trip' = current_trip - (u -> Trip)
  // the user no longer has a selected path
  and has_selected' = has_selected - (u -> Path)
  // the user no longer has origin and destination
  and trip_origin' = trip_origin - (u -> Location)
  and trip_destination' = trip_destination - (u -> Location)
  // clear suggested paths
  and suggested_paths' = suggested_paths - (u -> Path)
  // clear current segment
  and current_segment' = current_segment - (t -> PathSegment)
  
  // if LoggedInUser: archive the trip and keep it in the system
  and ((u in LoggedInUser) implies
        (Trip' = Trip
         and CompletedTrip' = CompletedTrip + t
         and bike_path' = bike_path
         and has_started' = has_started
         and has_finished' = has_finished
         and completed_trips' = completed_trips + (u -> t)))
  
  // if Guest: remove the trip from the system
  and ((u not in LoggedInUser) implies
        (Trip' = Trip - t
         and CompletedTrip' = CompletedTrip
         and bike_path' = bike_path - (t -> Path)
         and has_started' = has_started - (t -> Boolean)
         and has_finished' = has_finished - (t -> Boolean)
         and completed_trips' = completed_trips))

  // FRAME CONDITIONS
  currentLocation' = currentLocation
}

// "do_something_else" represents a step where the system does nothing (as in the guide)
// with respect to our abstractions (the user could do something else, but it doesn't affect our Trips and Paths).
//
// Alloy's traces are infinite. When all the loops are completed,
// none of our four main events can happen anymore (the preconditions
// fail). Without stuttering, the system couldn't generate valid
// traces because it would "hang" at some point.
//
// However, it seems to work the same without stuttering, but without stuttering, Alloy executes the preds 
// with an extra step, which means that the preconditions of our preds don't conflict too much 
// with each other.

pred do_something_else {
  // POSTCONDITIONS = FRAME CONDITIONS
  // Everything stays the same
  Trip' = Trip
  ActiveTrip' = ActiveTrip
  CompletedTrip' = CompletedTrip
  bike_path' = bike_path
  has_started' = has_started
  has_finished' = has_finished
  has_selected' = has_selected
  currentLocation' = currentLocation
  current_trip' = current_trip
  completed_trips' = completed_trips
  trip_origin' = trip_origin
  trip_destination' = trip_destination
  suggested_paths' = suggested_paths
  current_segment' = current_segment
}

// this fact specifies what events can happen at each step, the guide states:
// "Having specified our three events, we now need to constrain the valid transitions of the system. 
// This can be done by imposing through a fact that, at each possible state during the system evolution, 
// one of the three events must hold. To impose a constraint on all the states of a trace, we can use the 
// temporal operator always followed by the desired formula". 

fact trans {
  always (
    (some u: User, d: Location | selectOriginDestination[u, d]) or
    (some u: User | suggestPaths[u]) or
    (some u: User, p: Path | userSelectsPath[u, p]) or
    (some u: User | startTrip[u]) or
    (some u: User | moveAlongPath[u]) or
    (some u: User | stopTrip[u]) or
    (some u: User | finalizeTrip[u]) or
    do_something_else
  )
}

// PREDICATES

pred guestCompleteCycle {
  eventually (some d: Location | selectOriginDestination[Guest, d])
  and eventually suggestPaths[Guest]
  and eventually (some p: Path | userSelectsPath[Guest, p])
  and eventually startTrip[Guest]
  and eventually moveAlongPath[Guest]
  and eventually stopTrip[Guest]
  and eventually finalizeTrip[Guest]
}

pred loggedCompleteCycle {
  eventually (some d: Location | selectOriginDestination[LoggedInUser, d])
  and eventually suggestPaths[LoggedInUser]
  and eventually (some p: Path | userSelectsPath[LoggedInUser, p])
  and eventually startTrip[LoggedInUser]
  and eventually moveAlongPath[LoggedInUser]
  and eventually stopTrip[LoggedInUser]
  and eventually finalizeTrip[LoggedInUser]
  and eventually #LoggedInUser.completed_trips = 2
}

run guestCompleteCycle for 4 but exactly 3 Location, exactly 4 PathSegment, exactly 2 Path, 15 steps
run loggedCompleteCycle for 4 but exactly 3 Location, exactly 4 PathSegment, exactly 2 Path, 15 steps


// ASSERTS

// an active trip cannot be simultaneously completed
assert activeAndCompletedDisjoint {
  always (no t: Trip | t in ActiveTrip and t in CompletedTrip)
}

// a user cannot have more than one active trip at a time.
// and if they have an active trip, they must have a path selected that matches it.
assert oneActiveTripPerUser {
  always all u: User |
    lone u.current_trip
    and
    (some u.current_trip implies 
      (u.current_trip in ActiveTrip and 
       u.has_selected = bike_path[u.current_trip]))
}

// when a user moves along a path, he must follow the sequence of segments
assert tripCompletionAtDestination {
  always all u: User |
    (some u.current_trip and u.current_trip in ActiveTrip and 
     has_finished[u.current_trip] = True) implies u.currentLocation = u.trip_destination
}

// once a trip is in completed_trips, it stays there
assert completedTripsNeverLost {
  always all u: LoggedInUser, t: Trip | (t in u.completed_trips) implies
    (always t in u.completed_trips)
}

// every path must always connect its source to its destination
assert pathConnectivity {
  all p: Path |
    let firstSeg = {s: p.segments | s.segmentLocation = p.origin and
                    no s2: p.segments | s2.nextSegment = s} |
    let lastSeg = {s: p.segments | s.segmentLocation = p.destination and
                   no s.nextSegment} |
    some firstSeg and some lastSeg and
    lastSeg in firstSeg.*nextSegment
}

check activeAndCompletedDisjoint for 4 but exactly 3 Location, exactly 4 PathSegment, exactly 2 Path, 16 steps
check oneActiveTripPerUser for 4 but exactly 3 Location, exactly 4 PathSegment, exactly 2 Path, 16 steps
check tripCompletionAtDestination for 4 but 15 steps
check completedTripsNeverLost for 4 but exactly 3 Location, exactly 4 PathSegment, exactly 2 Path, 16 steps
check pathConnectivity for 4 but exactly 3 Location, exactly 4 PathSegment, exactly 2 Path, 15 steps