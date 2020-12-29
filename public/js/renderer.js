
$('#welcome-modal').modal({
  backdrop: 'static',
  keyboard: false,
  show: true
});
$('#load-existing').click(function(e) {
  $('#welcome-modal').modal('hide');
  $('#load-modal').modal({
    backdrop: 'static',
    keyboard: false,
    show: true
  });
});

$('.cancel-modal').click(function(e) {
  $('#load-modal').modal('hide');
  $('#new-modal').modal('hide');
  $('#welcome-modal').modal({
    backdrop: 'static',
    keyboard: false,
    show: true
  });
});
$('#new-topology').click(function(e) {
  $('#welcome-modal').modal('hide');
  $('#new-modal').modal({
    backdrop: 'static',
    keyboard: false,
    show: true
  });
});


$('#load').click(function(e) {
  if (!window.FileReader) {
    return alert('FileReader API is not supported by your browser.');
  }
  $('#load-modal').modal('hide');
  $('#spinner').css('opacity', '1');
  var $i = $('#file-chooser');
  var input = $i[0];
  if (input.files && input.files[0]) {
    file = input.files[0];
    fr = new FileReader();
    fr.onload = function () {
      var content = fr.result;
      parseLoadedFile(content);
    };
    fr.readAsText(file);
  } else {
    alert('File not selected or browser incompatible.');
  }
});


$('#new').click(function(e) {
  $('#spinner').css('opacity', '1');
  $.get('./public/json/topology_template.top', function(content) {
    parseLoadedFile(content);
  });
  $('#new-modal').modal('hide');
});

function parseLoadedFile(content) {
  setTimeout(function() {
    $('#content-wrapper').css('opacity', '1');
    $('#spinner').css('opacity', '0');
  }, 2000);
  globals.set('json', JSON.parse(content));
  globals.set('topgen', new Topgen());
}

window.addEventListener('resize', function(e) {
  // e.preventDefault();
  // that.onWindowResize();
 })
 

$('.sidebar-button').click(function(e) {
  var action = $(this).attr('data-action');

  globals.set('select-mode', selectmode);
  $('.sidebar-button').removeClass('sidebar-button-selected');
  $(this).addClass('sidebar-button-selected');

  var modes = globals.get('select-modes');
  for (var m in modes) {
    if (modes[m] === selectmode) {
      $('#select-mode-label').text('Selection Mode: ' + m);
    }
  }
});


$('#close-result-overlay').click(function() {
  $('#result-overlay').hide();    
});

$('#view-json').click(function() {
  var json = JSON.stringify(globals.get('json'), null, 4);
  $('#result-overlay textarea').text(json);
  $('#result-overlay').show();
});