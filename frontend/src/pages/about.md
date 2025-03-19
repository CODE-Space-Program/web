---
title: My Second Blog Post
author: Astro Learner
description: "After learning some Astro, I couldn't stop!"
image:
url: "https://docs.astro.build/assets/arc.webp"
alt: "The Astro logo on a dark background with a purple gradient arc."
pubDate: 2022-07-08
tags: ["astro", "blogging", "learning in public", "successes"]
---

# CODE Space Program

We are a student-led project group at [CODE University of Applied Sciences](https://code.berlin).<br>
Over the course of spring semester 2025, we are developing a rocket that is capable of doing a propulsion controlled landing.<br>
We write our own software, solder our own flight computer circuitry, and 3D-print our own parts.<br>
Since we first got the idea to build a rocket last year, we honed our skills in preparation for this project, and we have been able to make rapid progress since we officially started working on the project on March 6th 2025.

## Overview

The rocket is propelled by a D9-P rocket motor that provides nine newtons of thrust.<br>
Under ideal conditions, the rocket would reach an altitude of 25 meters, but due to imbalances and wind, it will naturally start to tilt.<br>
To combat this, we have a thrust vector control system (a gimbal that can tilt the rocket motor in all directions using two 9g servos), which will attempt to hold the rocket perfectly vertical.<br>
We don’t control the TVC manually, it is autonomously controlled by our flight computer.<br>
The flight computer makes its decisions based on two sensors: a gyroscope, which measures the angle of the rocket relative to the ground, and a barometer, which measures the air pressure, giving us an estimated altitude.<br>
Once the ascent motor has burned out, the rocket will begin to fall.<br>
At a moment determined by our flight simulation, the flight computer will ignite a second motor, which will break the fall of the rocket, and ideally make it land in one piece.<br>
Since we’ll have the same stability issues on the descent that we had on the ascent, the second motor will be controlled by the TVC system as well.<br>
During the entire flight, the flight computer will transmit live data to our server, which we will later analyse to help us tweak parameters for the next flight.<br>
The rocket design is based around parameters we got from [OpenRocket](https://openrocket.info), a flight simulation software.<br>

## Software

All our software is open source and available on [GitHub](https://github.com/orgs/CODE-Space-Program/repositories).

The flight computer code is written in c++. It uses the Arduino ecosystem and runs on an ESP32 microcontroller.

The flight computer communicates with our server, which also hosts our website [spaceprogram.bolls.dev](https://spaceprogram.bolls.dev).<br>
The website includes a live dashboard for analysing the flight data.<br>
Our backend code is written in TypeScript, and we use MongoDB as a database.<br>
Since our first flight will only reach a low altitude, we will be able to use HTTP over a wifi connection to communicate with the flight server.<br>
For future flights, we will likely switch to radio-based communication.

## Electronics

We use a single ESP32 microcontroller to read data from our sensors (MPU-6050, BMP390), and control two 9g servos via a PCA9685 board.<br>
It also controls the ignition of the rocket motors via two MOSFETs.

On the first prototype, the components are connected by wires.<br>
For future rockets, we will design a custom printed circuit board, both to save space and to have more reliable connections between the components.

## Manufacturing

We want to manufacture as many of our components ourselves, both for learning purposes and to have more control over our specific requirements.

The body of the rocket (called the &quot;airframe&quot;) is a 74.5 mm cardboard tube. This is standard for rocketry hobbyists.

We use [Fusion360](https://www.autodesk.com/products/fusion-360) to model our 3D-printed parts, which include the nose cone of the rocket, the TVC system, a holder connecting the flight computer to the airframe, and a custom battery case.

<style>
    body {
            font:
      16px/26px D-DIN-Regular,
      Arial,
      Verdana,
      sans-serif;

      color: #eee;

      background: #000;
    }
    h1 {
  color: #eee;
  font-size: 3rem;
  font-weight: 400;
  line-height: 3.5rem;

  margin: 1.5rem 0 3rem 0;
}
h2 {
  color: #eee;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 2rem;

  padding-top: 2.5rem;
  margin: 3rem 0 1.5rem 0;
  border-top: 1px solid rgb(31, 31, 31);
}
p {
  color: #eee;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.75rem;

  margin: 1.25rem 0;
}
a {
    color: oklch(0.717 0.1648 250.794);
    color: white;
    text-decoration: underline;
}
ul {
  margin: 1.25rem 0;
  padding-left: 1.625rem;
}
li {
  margin: 0.5rem 0;
  padding-left: 6px;
}
li::marker {
  color: rgb(161, 161, 161);
  line-height: 1.75rem;
}
table {
    border-collapse: collapse;
    margin: 1.75rem 0;

    font-size: 0.875rem
}
thead, tr:not(:last-child) {
    border-bottom: 1px solid rgb(31, 31, 31);
}
thead th {
    text-align: center;
    vertical-align: bottom;
    padding: 0.5rem;
    padding-top: 1px;
}
td {
    padding: 0.5rem;
}
thead th:first-child, td:first-child {
    padding-inline-start: 0;
}
thead th:last-child, td:last-child {
    padding-inline-end: 0;
}
code{font-size:13px;line-height:19.5px;padding:0.25rem;background: #1E242A;border-radius:0.25rem;color:rgb(240, 246, 252);}
    </style>
