// one  -> 1..1   (exactly one)
// lone -> 0..1   (zero or one, "lone" = "less or one")
// some -> 1..*   (one or more)
// set  -> 0..*   (zero or more, default if not specified)

// abstract sig Boolean {}
// one sig True, False extends Boolean {}
enum Boolean { True, False }


abstract sig User {  
  // operator "->" (slides 14-15):
  // creates a binary relation (Cartesian product between two sets).
  // "User -> Path" means: set of pairs (u, p) where u is User and p is Path.
  // in this case -> is not used but it's implicit, for example has_selected User -> Path
  var has_selected: lone Path,

  var currentLocation: one Location,
  var current_trip: lone Trip
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
  var has_finished: one Boolean
}

// "in": subsets and can be "var", in general they are not disjoint
// but in our case, ActiveTrip and CompletedTrip are disjoint (fact liveTripConsistency)
var sig ActiveTrip, CompletedTrip in Trip {}

sig Path {
   segments: some PathSegment 
}

// we assumed that it is something like "Piola"
sig Location {
  var belongsToPath: some PathSegment,
  var belongsToUser: some User
}

sig PathSegment {
  has: one Location
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
}

// "always F" means that the formula F must be true in ALL states
// of the trace (current state and all future states).
// "~" (TRANSPOSE) (Slides 40-41)
// if for example "has = {(seg1, loc1), (seg2, loc2)}" (segments → location)
// then "~has = {(loc1, seg1), (loc2, seg2)}" (location → segments)

// Location <--> PathSegment
// belongsToPath(loc -> seg) must be the inverse of has(seg -> loc)
// We can also write it using iff, but it's shorter that way
fact inv_loc_path { 
   always belongsToPath = ~has 
}

// Location <--> User
// belongsToUser(loc -> user) must be the inverse of currentLocation(user -> loc)
fact inv_loc_user { 
   always belongsToUser = ~currentLocation 
}

// each PathSegment must belong to at least one Path
fact segHasPath { 
   all s: PathSegment | some p: Path | s in p.segments 
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

pred userSelectsPath[u: User, p: Path] {
  // PRECONDITIONS
  // the user must not have already selected a path
  no u.has_selected

  // POSTCONDITIONS
  //add the new selection
  has_selected' = has_selected + (u -> p)

  // FRAME CONDITIONS, all other mutable relations do not change
  Trip' = Trip
  ActiveTrip' = ActiveTrip
  CompletedTrip' = CompletedTrip
  currentLocation' = currentLocation
  current_trip' = current_trip
  completed_trips' = completed_trips
  belongsToPath' = belongsToPath
  belongsToUser' = belongsToUser
  bike_path' = bike_path
  has_started' = has_started
  has_finished' = has_finished
}

pred startTrip[u: User] {
  // PRECONDITIONS
  // the user must have selected a path
  some u.has_selected
  // the user must not have an ongoing trip
  no u.current_trip
  // the user must be at a location on the selected route, TO DO: let the user select an origin and a destination
  // and let the position change over the sequence of path segments
  u.currentLocation in u.has_selected.segments.has

  // POSTCONDITIONS
  // create a new trip t that doesn't exist in the current state (it is like a trip that exist in the future, aka new)
  some t: Trip' - Trip |
    Trip' = Trip + t
    and ActiveTrip' = ActiveTrip + t
    and bike_path' = bike_path + (t -> u.has_selected)
    and has_started' = has_started + (t -> True)
    and has_finished' = has_finished + (t -> False)
    and current_trip' = current_trip + (u -> t)

  // FRAME CONDITIONS
  has_selected' = has_selected
  currentLocation' = currentLocation
  completed_trips' = completed_trips
  belongsToPath' = belongsToPath
  belongsToUser' = belongsToUser
  CompletedTrip' = CompletedTrip
}

pred stopTrip[u: User] {
  // PRECONDITIONS
  // the user must have an ongoing trip
  some u.current_trip
  // the trip must be active and already started
  some t: Trip | t = u.current_trip and t in ActiveTrip and has_started[t] = True

  // POSTCONDITIONS
  // mark the trip as finished, but it remains active
  some t: Trip | t = u.current_trip and
    // we need to substract the previous value, that before stopping the trip is False, otherwise it will not find
    // any instances. this happens because in the signature there is one Boolean.
    has_finished' = has_finished - (t -> Boolean) + (t -> True)
    and ActiveTrip' = ActiveTrip
    and current_trip' = current_trip
    and bike_path' = bike_path

  // FRAME CONDITIONS
  Trip' = Trip
  CompletedTrip' = CompletedTrip
  has_started' = has_started
  has_selected' = has_selected
  currentLocation' = currentLocation
  completed_trips' = completed_trips
  belongsToPath' = belongsToPath
  belongsToUser' = belongsToUser
}

// this pred is useful to see what is going on on the different users, so that we can see it in the transitions
pred finalizeTrip[u: User] {
  // PRECONDITIONS
  // the user must have an ongoing trip
  some u.current_trip
  // the trip must be active and already stopped (finished=True)
  some t: Trip | t = u.current_trip and t in ActiveTrip and has_finished[t] = True

  // POSTCONDITIONS
  some t: Trip | t = u.current_trip and
    // the trip is not active anymore
    ActiveTrip' = ActiveTrip - t
    // the user no longer has a current_trip
    and current_trip' = current_trip - (u -> Trip)
    // the user no longer has a selected path
    and has_selected' = has_selected - (u -> Path)
    
    // if LoggedInUser: archive the trip and keep it in the system
    and ((u in LoggedInUser) implies
          (Trip' = Trip
           and CompletedTrip' = CompletedTrip + t
           and bike_path' = bike_path
           and has_started' = has_started
           and has_finished' = has_finished
           and completed_trips' = completed_trips + (u -> t)))

    // if Guest: remove the trip from the system (no longer needed)
    and ((u not in LoggedInUser) implies
          (Trip' = Trip - t
           and CompletedTrip' = CompletedTrip
           and bike_path' = bike_path - (t -> Path)
           and has_started' = has_started - (t -> Boolean)
           and has_finished' = has_finished - (t -> Boolean)
           and completed_trips' = completed_trips))

  // FRAME CONDITIONS
  currentLocation' = currentLocation
  belongsToPath' = belongsToPath
  belongsToUser' = belongsToUser
}

// "do_something_else" represents a step where the system does nothing (as in the guide)
// with respect to our abstractions (the user could do something else, but it doesn't affect our Trips and Paths).
//
// alloy's traces are infinite, when all the loops are completed,
// none of our four main events can happen anymore (the preconditions
// fail). Without stuttering, the system couldn't generate valid
// traces because it would "hang" at some point.
//
// however, it seems to work the same without stuttering, but without stuttering, Alloy executes the preds 
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
  belongsToPath' = belongsToPath
  belongsToUser' = belongsToUser
}

// this fact specifies what events can happen at each step, the guide states:
// "Having specified our three events, we now need to constrain the valid transitions of the system. 
// This can be done by imposing through a fact that, at each possible state during the system evolution, 
// one of the three events must hold. To impose a constraint on all the states of a trace, we can use the 
// temporal operator always followed by the desired formula". 

fact trans {
  always (
    (some u: User, p: Path | userSelectsPath[u, p]) or
    (some u: User | startTrip[u]) or
    (some u: User | stopTrip[u]) or
    (some u: User | finalizeTrip[u]) or
    do_something_else
  )
}

// PREDICATES

pred bothUsersCycle {

  eventually (some p: Path | userSelectsPath[Guest, p])
  and eventually startTrip[Guest]
  and eventually stopTrip[Guest]
  and eventually finalizeTrip[Guest]
  and eventually #LoggedInUser.completed_trips = 2
  
  and eventually (some p: Path | userSelectsPath[LoggedInUser, p])
  and eventually startTrip[LoggedInUser]
  and eventually stopTrip[LoggedInUser]
  and eventually finalizeTrip[LoggedInUser]
}

pred guestCompleteCycle {
  eventually (some p: Path | userSelectsPath[Guest, p])
  and eventually startTrip[Guest]
  and eventually stopTrip[Guest]
  and eventually finalizeTrip[Guest]
}

pred loggedCompleteCycle {
  eventually (some p: Path | userSelectsPath[LoggedInUser, p])
  and eventually startTrip[LoggedInUser]
  and eventually stopTrip[LoggedInUser]
  and eventually finalizeTrip[LoggedInUser]
  and eventually #LoggedInUser.completed_trips = 2
}

run bothUsersCycle for 3 but 15 steps
run guestCompleteCycle for 3 but 8 steps
run loggedCompleteCycle for 3 but 9 steps