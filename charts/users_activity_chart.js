(function() {
  "use strict";
  jQuery(document).ready(function() {

    // expand the current selected menu
    jQuery('#metrics-sidemenu').foundation('down', jQuery(`#${window.users_activity.base_slug}-menu`));


    show_users_activty_overview()

  })

  function show_users_activty_overview(){

    let localizedObject = window.users_activity // change this object to the one named in ui-menu-and-enqueue.php
    let translations = localizedObject.translations

    get_users_activity();

    let chartDiv = jQuery('#chart') // retrieves the chart div in the metrics page

    chartDiv.empty().html(`
      <span class="section-header">${localizedObject.translations.title}</span>

      <hr style="max-width:100%;">

      <div id="chartdiv"></div>

      <hr style="max-width:100%;">
    `)

  }

  window.get_users_activity = function get_users_activity() {


    let localizedObject = window.users_activity // change this object to the one named in ui-menu-and-enqueue.php

    $('#sample_spinner').addClass("active")

    return jQuery.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: `${localizedObject.rest_endpoints_base}/user_activity`,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('X-WP-Nonce', localizedObject.nonce);
      },
    })
    .done(function (data) {
      $('#sample_spinner').removeClass("active")
      console.log( 'success' )
      console.log( data )
      build_table( data );
    })
    .fail(function (err) {
      $('#sample_spinner').removeClass("active")
      console.log("error");
      console.log(err);
    })
  }

  function build_table(data) {
    console.log("build table");
    let header_row_html = build_quickAction_header();
    let user_rows_html = build_user_activity_rows(data);
    let table_html = `<table>
      <thead>${header_row_html}</thead>
      ${user_rows_html}
    </table>`
    jQuery('#chartdiv').html(table_html);

  }
})();

function build_user_activity_rows(data) {
  let userActivityRow = '';
  for (const userName in data) {
    let row_html = build_quickAction_totals(data[userName]);
    userActivityRow += `<tr class="dnd-moved">
    <td style="white-space: nowrap" >${userName}</td>
    ${row_html}
    </tr>
    `
  }
  return userActivityRow;
}

function build_quickAction_totals(data) {
  let row_html = '';
  Object.keys(window.users_activity.post_type_settings.fields).forEach((key) => {
    if (key.includes('quick_button')) {
      row_html += `<td>${(data[key]) ? data[key] : '0'}</td>`;
    }
  })
  return row_html;
}

function build_quickAction_header() {
  let header_row_html = '<td>User</td>';
  Object.keys(window.users_activity.post_type_settings.fields).forEach((key) => {
    if (key.includes('quick_button')) {
      header_row_html += `</td><td>${window.users_activity.post_type_settings.fields[key].name}</td>`;
    }
  })
  return header_row_html;
}
