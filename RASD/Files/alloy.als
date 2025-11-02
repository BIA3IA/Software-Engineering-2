// one -> 1..1
// lone -> 0..1
// some -> 1..*
// set -> 0..*

// ENUMS

enum PathStatus{Optimal, Medium, Sufficient, RequiresMaintenance, Closed}

enum ObstacleType{Pothole, Works, FallenTree, Flooding}

enum ReportStatus{Confirmed, Pending, Dismissed}

enum Boolean{True, False}


// Abstract signatures

abstract sig User {
	var has_selected: lone Trip,
}

abstract sig Report {
	obstacle: one ObstacleType,
	report_status: one ReportStatus,
	segment: one PathSegment	
}

// Signatures

sig Guest extends User {
	
} 

sig LoggedInUser extends User {
	var completed_trips: set Trip,
	var authoredReports: set Report,
	var authoredConfirmations: set Confirmation
} {
	always (completed_trips.has_started = False and completed_trips.has_finished = True)
	always (no (completed_trips & has_selected))
}

sig Trip {
	var has_started: one Boolean,
	var has_finished: one Boolean,
	bike_path: one Path
}{
	always ( has_started = True implies eventually has_finished = True )
	always ( has_finished = True implies has_started = False )
}

sig Path {
	segments: some PathSegment
}

sig PathSegment {
	var path_status: one PathStatus
}

sig ManualReport extends Report {

}

sig AutomaticReport extends Report {

}

sig MergedReport {
	var mergedReport_status: one ReportStatus
}

sig Confirmation {
	confirm: some Report
}

// ~ -> reverse relation between user and trip
fact TripsAreNotShared {
  always (all t: Trip | one t.~has_selected)
}

fact ReportsAreNotShared {
  always (all r: Report | one r.~authoredReports)
}

fact ConfirmationsAreNotShared {
  always (all c: Confirmation | one c.~authoredConfirmations)
}

// Confirmations can only be made on:
// - Segments of the current trip (if a trip is selected and started)
// - Trip segments completed by the user
fact ConfirmationsOnlyOnCurrentOrCompletedSegment {
  always (all u: LoggedInUser, c: u.authoredConfirmations |
    c.confirm.segment in (u.has_selected.bike_path.segments + u.completed_trips.bike_path.segments)
  )
}

// same as above
fact ReportsOnlyOnCurrentOrCompletedSegment {
  always (all u: LoggedInUser, r: u.authoredReports |
    r.segment in (u.has_selected.bike_path.segments + u.completed_trips.bike_path.segments)
  )
}

pred world[l:LoggedInUser, g: Guest]{
	#l = 1
	#g = 1
}

run world