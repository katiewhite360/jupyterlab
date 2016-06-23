# Design of the terminal plugin

This document describes the design of the terminal plugin. Any significant change
to the terminal plugin should also involve changes here.

# Personas

## Experienced Data Scientist

The Experienced Data Scientist has a graduate degree in a technical field and has
been coding for more than 5 years in multiple languages. They are in their mid 30s,
have a solid income and live in an urban setting. In the past they have used the
Jupyter Notebook alongside a text editor (Sublime Text) and the Terminal app on a
Mac. They love to code and feel at home in a terminal.

**Goal:** Replace the usage of Mac's Terminal app, in particular when running
Jupyter on a remote system.

Some things they would do in the terminal include:

* Run command line git.
* Small amounts of general software engineering to support their data science, such
  as running test suites, moving files around at the command line.
* Run vim.
* Run command line IPython.

## Student learning the terminal in a Software Carpentry Workshop



# User tasks

Users should be able to:

* Open a new terminal (command palette, menu)
* Close a terminal (UI)
* Close all terminals (command palette)
* See the name of the terminal in the dock area tab (UI)
* Copy text from the terminal (UI+keyboard)
* Paste text into the terminal (UI+keyboard)
* Reconnect all terminals after a network outage (command palette)
* Increase the font size of the terminal (command palette, menu)
* Decrease the font size of the terminal (command palette, menu)
* Toggle between black/white and white/black (command palette, menu)

# Visual design

Describe the visual design specifiation here in words. Actual visual design work, including screenshots of wireframes or mockups should be done in individual issues.

* Layout
* Typography
* Colors
* Motion

