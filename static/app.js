$(function() {
    var loggedIn = false;

    // check whether session already logged in
    function checkAuth() {
        $.getJSON('/api/auth', function(resp) {
            if (resp.logged_in) {
                loggedIn = true;
                $('#loginPanel').hide();
                $('#addBtn').show();
            }
            loadServers();
        }).fail(function(){
            loadServers();
        });
    }

    function loadServers() {
        $.getJSON('/api/servers', function(data) {
            renderTable(data.servers, {});
            // load each server's status asynchronously
            $.each(data.servers, function(name) {
                $.getJSON('/api/status/' + encodeURIComponent(name), function(resp) {
                    updateServerStatus(name, resp.status);
                });
            });
        });
    }
    function updateServerStatus(name, status) {
        var rowClass = status.toLowerCase().includes('on') ? 'table-success' : (status.toLowerCase().includes('off') ? 'table-danger' : 'table-warning');
        var $row = $('table tbody tr').filter(function() {
            return $(this).find('td').eq(0).text() === name;
        });
        $row.attr('class', rowClass);
        $row.find('td').eq(2).text(status);
    }
    function renderTable(servers, statuses) {
        if ($.isEmptyObject(servers)) {
            $('#serversContainer').html('<p>No servers configured.</p>');
            return;
        }
        var html = '<table class="table table-bordered"><thead class="table-light"><tr><th>Name</th><th>Host</th><th>Status</th>' +
                   (loggedIn ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';
        $.each(servers, function(name, info) {
            var stat = statuses[name] || 'loading...';
            var rowClass = 'table-secondary';
            html += '<tr class="' + rowClass + '">';
            html += '<td>' + name + '</td>';
            html += '<td>' + info.host + '</td>';
            html += '<td>' + stat + '</td>';
            if (loggedIn) {
                html += '<td>' +
                        '<button class="btn btn-sm btn-success powerBtn" data-name="' + name + '" data-action="on">On</button> ' +
                        '<button class="btn btn-sm btn-danger powerBtn" data-name="' + name + '" data-action="off">Off</button> ' +
                        //'<button class="btn btn-sm btn-outline-secondary removeBtn" data-name="' + name + '">Remove</button>' +
                        '</td>';
            }
            html += '</tr>';
        });
        html += '</tbody></table>';
        $('#serversContainer').html(html);
    }
    function showAddForm() {
        var form = '<div class="card p-3"><h4>Add Server</h4>' +
                   '<div class="mb-3"><label>Name</label><input id="sname" class="form-control"></div>' +
                   '<div class="mb-3"><label>Host</label><input id="shost" class="form-control"></div>' +
                   '<div class="mb-3"><label>User</label><input id="suser" class="form-control"></div>' +
                   '<div class="mb-3"><label>Password</label><input id="spass" type="password" class="form-control"></div>' +
                   '<button id="saveBtn" class="btn btn-primary">Save</button> ' +
                   '<button id="cancelBtn" class="btn btn-secondary">Cancel</button></div>';
        $('#formContainer').html(form).show();
    }
    $('#addBtn').click(function() {
        showAddForm();
    });

    // login logic
    $('#loginBtn').click(function() {
        var pw = $('#loginPass').val();
        $.ajax({
            url: '/api/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({password: pw})
        }).done(function() {
            loggedIn = true;
            $('#loginPanel').hide();
            $('#addBtn').show();
            loadServers();
        }).fail(function() {
            $('#loginError').show();
        });
    });
    $('#formContainer').on('click', '#cancelBtn', function() {
        $('#formContainer').hide().empty();
    });
    $('#formContainer').on('click', '#saveBtn', function() {
        var payload = {
            name: $('#sname').val(),
            host: $('#shost').val(),
            user: $('#suser').val(),
            password: $('#spass').val()
        };
        $.ajax({
            url: '/api/servers',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload)
        }).done(function() {
            $('#formContainer').hide().empty();
            loadServers();
        });
    });
    $('#serversContainer').on('click', '.powerBtn', function() {
        var name = $(this).data('name');
        var action = $(this).data('action');
        $.post('/api/power/' + encodeURIComponent(name) + '/' + action, function() {
            loadServers();
        });
    });
    $('#serversContainer').on('click', '.removeBtn', function() {
        var name = $(this).data('name');
        $.ajax({url: '/api/servers/' + encodeURIComponent(name), method: 'DELETE'})
          .done(loadServers);
    });
    checkAuth();
});