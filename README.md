# 8840-app

**This project is currently in development.**  
**Made by Team 8840, Bay Robotics**  
**Credits to [Jaiden Grimminck](https://github.com/JaidenAGrimminck)**  

URL: [https://frc8840.github.io/8840-app/](https://frc8840.github.io/8840-app/)  
PathPlanner: [https://frc8840.github.io/8840-app?tab=path_planner](https://frc8840.github.io/8840-app?tab=path_planner)  
Simulation Controls: [https://frc8840.github.io/8840-app?tab=controls](https://frc8840.github.io/8840-app?tab=controls)  
Neural Network Visulation (of a pre-determined input and output): [https://frc8840.github.io/8840-app?tab=nn](https://frc8840.github.io/8840-app?tab=nn)
Till (not ready yet): [https://frc8840.github.io/8840-app?tab=till](https://frc8840.github.io/8840-app?tab=till)  

## Overview

This project is our team's web dashboard for the First Robotics Competition.

This repository contains a react project with an autonomous robot planner, physics simulation for the compeition, and AI tools. It also contains tools ([credit to pynetworktables2js](https://github.com/robotpy/pynetworktables2js)) to communicate with NetworkTables and with our own servers running on the robot with [8840-utils](https://github.com/frc8840/).

## How to Run

Unfortunately, it's a bit difficult to run since we don't have a built version online, but you can run it locally. In the future we'll add an online version too, but for now you'll have to download it first.

## Downloading

First, you'll need to download the repository. You can do this by clicking the green "Code" button and then clicking "Download ZIP". Expand the ZIP and you'll have the repository.

## Running

To run the project, you'll need to have [Node.js](https://nodejs.org/en/) installed. Once you have Node.js installed, open a terminal in the repository folder and run `npm install`. This will install all the dependencies. Once that's done, run `npm start` and the project will start running in your browser.

## How to Use

### Autonomous Robot Planner

Go to `https://localhost:3000/?tab=path_planner` to open it. (Or whatever port you're running the server on instead of 3000.)

Once open, by hovering your mouse around the field and pressing the A key, you can add "Hard Points" and "Soft Points". The hard points are the starts and ends of the path segments/bézier curves, and the soft points are the control points of the bézier curves.

To see what points the robot will be at, press the G key to generate the PID points.

To edit the timeline, press the T key. You can edit events by pressing the E key and hovering over an event. You can also add events by pressing the R key and hovering over the timeline.

To save the path locally, press the S key. To load a path, press the L key.

To generate the timeline, press the H key. To play the timeline, press the Spacebar. To restart the playback, press the K key. To go forward a bit or back a bit, use the arrow keys.

Key List:

- `A`: Add points
- `G`: Generate PID points
- `T`: Edit timeline
- `E`: Edit event
- `R`: Add event
- `S`: Save path
- `L`: Load path
- `H`: Generate timeline
- `Spacebar`: Play timeline
- `K`: Restart playback
- `Left Arrow`: Go back a bit
- `Right Arrow`: Go forward a bit

### Physics Simulation

You can view it at `http://localhost:3000/`. The physics simulation is a bit buggy, but it's still pretty cool. It'll be improved in the near future to be used with AI tools, and for one of our team's goals, which is to be able to have a robot that can play a full match without human input.

The physics simulation currently doesn't have much, but you can intereact with it using your mouse. You can use your mouse to bump into the balls and make them move around. The wall physics are a bit broken though, they will be fixed in the next few weeks though.

### AI Tools

Right now, there isn't many AI tools accessable in the front end, but you can view them at `http://localhost:3000/?tab=nn`. You can see a graph of the neural network's error, the neurons layed out, and a train button. You can see the outputs of the train button in the console (inspect element -> console).

## Contributing

If you want to contribute, you can fork the repository and make a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Credits

Thank you to the pynetworktables2js team for making the NetworkTables connection code. You can find their repository [here](https://github.com/robotpy/pynetworktables2js).

## Contact

You can contact us [here, on our website](https://www.team8840.org/contact).
