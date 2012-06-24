Symbol-Maps
===========

Proportional Symbol Maps using Google Maps. Proportional Symbol Maps
are a cartographic tool for visualizing data associated with a
geographical location, for example earthquakes magnitudes or population of cities.

This tool uses circles to represent these events, with its area
proportional do the quantity being measured and with center in the
projection of the latitude and longitude.

Usage
=====

Load a CSV file using semi-colon (;) as separator. The first column is
the latitude, the second is the longitude and the third column is the
measured intensity of the location. See any file at instances/ for an example. Then click on 'Upload'

You may select the scale factor of the symbols as well as the maximum
number of cities to be shown. You can also delimit the areas of the
map in which you want the circle to be shown by drawing
polygons. Click on 'Delimit area' to start drawing the polygon and
right-click when you're done. Finally, click the 'Filter regions'
button to remove all circles that are outside the polygon.

TO-DO List
==========

* Build a select list to use the instances at instances/ and not require the user to load a file. 
