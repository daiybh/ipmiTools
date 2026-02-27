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
        // update underlying table data via bootstrap-table API
        $('#serversTable').bootstrapTable('updateByUniqueId', {
            id: name,
            row: { status: status }
        });
        // optionally adjust row class via refreshOptions
        var rowClass = status.toLowerCase().includes('on') ? 'table-success' : (status.toLowerCase().includes('off') ? 'table-danger' : 'table-warning');
        $('#serversTable').bootstrapTable('updateByUniqueId', {
            id: name,
            row: { _rowClass: rowClass }
        });
    }
    function renderTable(servers, statuses) {
        if ($.isEmptyObject(servers)) {
            $('#serversContainer').html('<p>No servers configured.</p>');
            return;
        }
        // transform servers map into array of rows
        var rows = [];
        $.each(servers, function(name, info) {
            rows.push({
                name: name,
                host: info.host,
                status: statuses[name] || 'loading...',
                _rowClass: 'table-secondary'
            });
        });
        // column definitions for bootstrap-table
        var columns = [
            { field: 'name', title: 'Name', sortable: true, uniqueId: true },
            { field: 'host', title: 'Host', sortable: true },
            { field: 'status', title: 'Status', sortable: true }
        ];
        if (loggedIn) {
            columns.push({
                field: 'actions',
                title: 'Actions',
                formatter: function(value, row) {
                    return '<button class="btn btn-sm btn-success powerBtn" data-name="' + row.name + '" data-action="on">On</button> '
                         + '<button class="btn btn-sm btn-danger powerBtn" data-name="' + row.name + '" data-action="off">Off</button>';
                }
            });
        }
        $('#serversContainer').html('<div class="table-responsive"><table id="serversTable"></table></div>');
        $('#serversTable').bootstrapTable({
            data: rows,
            columns: columns,
            search: true,
            pagination: true,
            uniqueId: 'name',
            rowStyle: function(row, index) {
                return { classes: row._rowClass || '' };
            }
        });
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