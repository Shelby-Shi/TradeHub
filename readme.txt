# COMP3900-H11A-UNDEFINED
Lecturer/Admin: Matthew Sladescu
Tutors/Mentors: Rachid Hamadi


## First time Setup and Run
1. Open a terminal and clone the directory using git, or unpack the zip file:
$> git clone git@github.com:unsw-cse-capstone-project/capstone-project-comp3900-h11a-undefined.git h11a-undefined

2. Navigate to the new folder via the terminal, or open a terminal in the new folder:
$> cd h11a-undefined

3. Execute setup.sh. Please note that this process may take a few minutes to download and install the requirements, and fully initialise the web application.
$> ./setup.sh
Setup.sh is only needed for first time deployment of the web application, afterwards you only need to execute run.sh:
$> ./run.sh
The default web browser will automatically open and navigate to the deployed web application. If this does not occur, navigate to address localhost:3000. Ensure port 5000 is not blocked as the flask server will run on this port.

4. To close the web application, simply type CTRL-C in the terminal.