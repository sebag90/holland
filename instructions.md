# Vacation home organization tool

## GOAL
The goal is to build a tool to manage a vacation home among 5 people

## Requirements
* Calendar: This will be used to book the vacation home, every user can book a period in a shared calendar
* Forum: Each user can open a thread where people can answer, pretty much like in any forum. Very important is the ability to open a poll.
  Users should also be able to upload images and documents

### Technical Requirements
This application will be composed of 3 components:
* Backend: written in python as a fast api application, use UV for dependency management
* DB: let's use postgres
* Frontend: Feel free to use whichever stack fits the requirements the most

The application will be hosted with podman podlet.
During development I need a justfile with 3 commands:
* backend: build and deploy the backend container
* db: deploy a postgres instance
* frontend: build and deploy the frontend container

These commands will alllow me to deploy components individually during development.

### UX/UI
The UX/UI of the application should be very simple and intuitive. The homepage should give an overwiew of the current month with bookings and the latest threads


# REVISIONS:
## 1:
* After the first iteration we decided not to allow users to register, instead users and passwords will be read on a htpasswd file that will be mounted on the appropriate container
* Add a TO-DO page where each user can modify a todo list that is visible and can be modified by everyone
* there are 2 kind of bookings:
  * internal (from users): these bookings can only be modified by the user who created it
  * external: these bookings can be created by every users and are there to block the house for external guests who do not have an account
* The Calendar view is a bit clonky, Ideally a new appointment can be created by clicking on the calendar and a pop up menu will show up with start date (on the day clicked), end date, kind of calendar (internal, external - internal should be default). Internal and external will be shown with a different color
* use european (german) date locale DD.MM.YYYY HH:MM


## 2:
in the todo, give the possibility to add a description to the entry: like "buy firewood" and as a description I can add something like "needed for the pizza oven, buy in praxis"

## 3:
in the todo: one slight change: the beschreibung field should be there by default, must not be added with a button. if empty it will not be displayed

## 4:
ok now let's take a look at the forum/new page: the add a poll with a checkbox is not very intuitive and can be overseen, instead after the body of the
 thread make a light separation horizontal line and split the view 50% in one half you can upload a file and in the other half the button to add a poll. a
 popup will show up with the options to add the poll (what currently happens when clicking on the checkbox)


## 5:
we will address 2 problems in the frontend:
* bookings currently only show until the day before departure, it would be better if the last day also is shown in the overview of the calendar
* the frontend needs to be reactive to work with telephones screens
