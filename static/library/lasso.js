function polygonToPath(polygon) {
    return ("M" + (polygon.map(function (d) { return d.join(','); }).join('L')));
}

function distance(pt1, pt2) {
  return Math.sqrt(Math.pow( (pt2[0] - pt1[0]), 2 ) + Math.pow( (pt2[1] - pt1[1]), 2 ));
}

function lasso(x, y, width, height) {
    let dispatch = d3.dispatch('start', 'end');

    let closeDistance = 75;

    function lasso(root) {
        const g = root.append('g').attr('class', 'lasso-group');
        const area = g.append('rect')
            .attr('x', x)
            .attr('y', y)
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'tomato')
            .attr('opacity', 0);
        
        const drag = d3.drag()
            .on('start', handleDragStart)
            .on('drag', handleDrag)
            .on('end', handleDragEnd);
        
        area.call(drag);

        let lassoPolygon;
        let lassoPath;
        let closePath;

        function handleDragStart(event) {
            const point = d3.pointer(event);
            //point[0] -= x;
            point[1] -= 0;

            lassoPolygon = [point];
            if (lassoPath) {
                lassoPath.remove();
            }

            lassoPath = g.append('path')
                .attr('fill', '#0bb')
                .attr('fill-opacity', 0.1)
                .attr('stroke', '#0bb')
                .attr('stroke-dasharray', '3, 3');
            
            closePath = g.append('line')
                .attr('x2', lassoPolygon[0][0])
                .attr('y2', lassoPolygon[0][1])
                .attr('stroke', '#0bb')
                .attr('stroke-dasharray', '3, 3')
                .attr('opacity', 0);
            
            dispatch.call('start', lasso, lassoPolygon);
            
        }

        function handleDrag(event) {
            const point = d3.pointer(event);
            //point[0] -= x;
            point[1] -= (y + 118);

            lassoPolygon.push(point);
            lassoPath.attr('d', polygonToPath(lassoPolygon))


            // if we are within closing distance
            if (distance(lassoPolygon[0], lassoPolygon[lassoPolygon.length - 1]) < closeDistance) {
                closePath
                    .attr('x1', point[0])
                    .attr('y1', point[1])
                    .attr('opacity', 1);
            } else {
                closePath.attr('opacity', 0);
            }
        }

        function handleDragEnd(event) {
            closePath.remove();
            closePath = null;

            if (distance(lassoPolygon[0], lassoPolygon[lassoPolygon.length - 1]) < closeDistance) {
                lassoPath.attr('d', polygonToPath(lassoPolygon) + 'Z');
                dispatch.call('end', lasso, lassoPolygon);
            } else {
                lassoPath.remove();
                lassoPath = null;
                lassoPolygon = null;
            }
        }

        lasso.reset = () => {
            if (lassoPath) {
                lassoPath.remove();
                lassoPath = null;
            }

            lassoPolygon = null;
            if (closePath) {
                closePath.remove();
                closePath = null;
            }
        };    
    }

    lasso.on = (type, callback) => {
        dispatch.on(type, callback);
        return lasso;
    };

    return lasso;
}