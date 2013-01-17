function init_coefs(coef_nums, coef_names) {
    var coefs = new Array(coef_names.length);
    for(var i=0; i < coef_names.length; i++){
        coefs[coef_names[i]] = coef_nums[i];
    }

    return coefs;
}

// Updates hazard function by multiplying each coefficient by its new value
// We need a function that updates the covariate array when a change is made to the form
function update_hazard(data, coef, covar) {
    var tmpdata = JSON.parse(JSON.stringify(data));
    var xb = 0;

    for(key in coef){
        xb = xb + coef[key]*covar[key];
    }
    var prop = Math.exp(xb);
    for(var j=0; j < data.length; j++){
        tmpdata[j].haz = Math.exp(-data[j].haz*prop);
    }
    return tmpdata;
}

function HealthvisSurvival() {
    this.w = 700;
    this.h = 400;

    // Base vis layer
    this.vis = null;

    this.init_data1=null;
    this.init_data2=null;
    this.init_vals=null;
    this.coef_names=null;
    this.coef=null;
    this.covar=null;
    this.vtype=null;
    this.line=null;
    this.x=null;
    this.y=null;
    this.group_names=null;

    this.init = function(elementId, d3Params) {
        this.vis = d3.select(elementId)
            .append('svg:svg')
            .attr('width', this.w)
            .attr('height', this.h+30)
            .append('svg:g')
            .attr('transform', 'translate(' + 40 + ',' + 10 + ')');

        this.init_data1 = JSON.parse(d3Params.data1); //", dat ,";
        this.init_data2 = JSON.parse(d3Params.data2);
        var coef_nums = d3Params.csort; //[", paste(c.sort, collapse=", ") ,"];
        this.coef_names = d3Params.cnames; //[", paste("'", paste(c.names, collapse="', '"), "'", sep="") ,"];
        var vlist = d3Params.vars; //[", paste("'", paste(vars, collapse="', '"), "'", sep="") ,"];
        var mtype = d3Params.menutype; //[", paste("'", paste(menu.type, collapse="', '"), "'", sep="") ,"];

        //var init_vals = [", paste(rep(0, length(c.sort)), collapse=", ") ,"];
        this.init_vals = new Array(this.coef_names.length);
        for (var i=0; i < this.coef_names.length; i++) {
            this.init_vals[this.coef_names[i]]=0;
        }

        // Initialize associative array of coefficients and coef names
        this.coef=coef_nums;
        // Initialize patient values to 0 to get baseline hazard
        this.covar=this.init_vals;
        // Initialize associative array of variable names
        this.vtype = init_coefs(mtype, vlist);

	this.group_names=d3Params.group_names;

        // line color
        this.colors = d3Params.linecol;

        // scales
        this.x = d3.scale.linear().domain([0,d3Params.daymax]).range([0, this.w]);
        this.y = d3.scale.linear().domain([-0.1,1]).range([this.h, 0]);
    };

    this.visualize = function() {

        // Initialize baseline hazard function
        var data1 = update_hazard(this.init_data1, this.coef, this.covar);
        var data2 = update_hazard(this.init_data2, this.coef, this.covar);


        // create xAxis
        var xAxis = d3.svg.axis().scale(this.x).orient('bottom');

        // Add the x-axis.
        this.vis.append('svg:g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + (this.h-30) + ')')
                .call(xAxis);

	this.vis.append('text')
		.attr('class', 'x label')
		.attr('x', this.w/2-12)
		.attr('y', this.h+10)
		.text('Time');

        // create left yAxis
        var yAxis = d3.svg.axis().scale(this.y).ticks(6).orient('left');

        // Add the y-axis to the left
        this.vis.append('svg:g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(-5,0)')
                .call(yAxis);

	this.vis.append('text')
		.attr('class', 'y label')
		.attr('x', -200)
		.attr('y', -30)
//		.attr('transform', 'rotate(-90,-5,'+ (this.h/2-12)/2+')')
		.attr('transform', 'rotate(-90)')
		.text('Survival');

        var colors = this.colors;

        // Line drawer
        var x = this.x;
        var y = this.y;
        this.line = d3.svg.line()
                          .x(function(d){return x(d.time);})
                          .y(function(d){return y(d.haz);})
                          .interpolate('step-after');

        // Add path layer
        this.vis.selectAll('.line')
                .data([data1, data2])
                .enter().append('path')
                 .attr('class', 'line')
		 .style('stroke', function(d,i){return colors[i];})
                 .attr('d', this.line);

	// Add legend
	var legend = this.vis.append('g')
		  .attr('class', 'legend')
		  .attr('x', this.w - 165)
		  .attr('y', 125)
		  .attr('height', 200)
		  .attr('width', 200);

	legend.selectAll('rect')
	   .data(colors).enter().append('rect')
	  .attr('x', this.w - 165)
	  .attr('y', function(d,i){return i*20;})
	  .attr('width', 10)
	  .attr('height', 10)
	  .style('fill', function(d) { return d; });

	var group_names = this.group_names;

	legend.selectAll('text')
	   .data(group_names).enter().append('text')
	  .attr('x', this.w - 145)
	  .attr('y', function(d,i){return i*20 + 10;})
	  .text(function(d) { return d; });


  // This is for mouseover, not sure if necessary

  //      this.vis.selectAll('circle')
  //          .data(data1)
  //          .enter()
  //          .append('svg:circle')
  //          .attr('cx', function(d) { return x(d.time); })
  //          .attr('cy', function(d) { return y(d.haz); })
  //          .attr('r', 3)
  //          .attr('opacity', 0)
  //          .append('svg:title')
  //          .text(function(d){return 'Day: '+d.time+'\nSurvival: '+Math.round(d.haz*1000)/1000;});

	
    }

    this.update_covar = function(newcov){
        for (var j=0; j<this.coef_names.length; j++) {
            this.covar[this.coef_names[j]]=0;
        }

        for(var j=0; j < newcov.length; j++){
            if(this.vtype[newcov[j].name] == 'continuous'){
                this.covar[newcov[j].name] = parseFloat(newcov[j].value);
            } else {
                this.covar[(newcov[j].name+newcov[j].value)]=1;
            }
        }
    }

    this.update = function(newcov) {
        this.update_covar(newcov);

        var tmp1 = update_hazard(this.init_data1, this.coef, this.covar);
        var tmp2 = update_hazard(this.init_data2, this.coef, this.covar);
        this.vis.selectAll('path.line')
            .data([tmp1, tmp2])
            .transition().duration(1800).delay(100).ease('elastic')
            .attr('width', 0)
            .attr('d', this.line);

        var x = this.x;
        var y = this.y;
      //  this.vis.selectAll('circle')
      //      .data(tmp)
      //      .transition().duration(1800).delay(100).ease('elastic')
      //      .attr('cx', function(d) { return x(d.time); })
      //      .attr('cy', function(d) { return y(d.haz); })
      //      .attr('r', 3)
      //      .attr('opacity', 0)
    }
}

healthvis.register(new HealthvisSurvival());
