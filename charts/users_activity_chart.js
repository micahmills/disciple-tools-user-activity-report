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
      <div class="date_range_picker">
        <i class="fi-calendar"></i>&nbsp;
        <span>${moment().format("YYYY")}</span>
        <i class="dt_caret down"></i>
    </div>
      <hr style="max-width:100%;">

      <div id="chartdiv"></div>

      <hr style="max-width:100%;">
      <div id="spinner" style="display: inline-block" class="loading-spinner"></div>
    `)
    setupDatePicker();
  }



  window.get_users_activity = function get_users_activity(startDate, endDate, label) {
    let localizedObject = window.users_activity // change this object to the one named in ui-menu-and-enqueue.php
    $('#spinner').addClass("active")
    let data = { "startDate": startDate , "endDate": endDate };
    // let data = {};
    return jQuery.ajax({
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: `${localizedObject.rest_endpoints_base}/user_activity`,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('X-WP-Nonce', localizedObject.nonce);
      },
    })
    .done(function (data) {
      $('#spinner').removeClass("active")
      build_table( data );
      if (data) {
        $('.date_range_picker span').html( label );
      }
    })
    .fail(function (err) {
      $('#spinner').removeClass("active")
      console.log("error");
      console.log(err);
    })
  }

  function build_table(data) {
    let header_row_html = build_quickAction_header();
    let user_rows_html = build_user_activity_rows(data);
    let table_html = `<table>
      <thead>${header_row_html}</thead>
      ${user_rows_html}
    </table>`
    jQuery('#chartdiv').html(table_html);

  }

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

function setupDatePicker(startDate, endDate) {
  $(".date_range_picker").daterangepicker(
    {
      showDropdowns: true,
      ranges: {
        "All time": [moment(0), moment().endOf("year")],
        [moment().format("MMMM YYYY")]: [
          moment().startOf("month"),
          moment().endOf("month"),
        ],
        [moment().subtract(1, "month").format("MMMM YYYY")]: [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
        [moment().subtract(2, "month").format("MMMM YYYY")]: [
          moment().subtract(2, "month").startOf("month"),
          moment().subtract(2, "month").endOf("month"),
        ],
        [moment().subtract(3, "month").format("MMMM YYYY")]: [
          moment().subtract(3, "month").startOf("month"),
          moment().subtract(3, "month").endOf("month"),
        ],
        [moment().format("YYYY")]: [
          moment().startOf("year"),
          moment().endOf("year"),
        ],
        [moment().subtract(1, "year").format("YYYY")]: [
          moment().subtract(1, "year").startOf("year"),
          moment().subtract(1, "year").endOf("year"),
        ],
        [moment().subtract(2, "year").format("YYYY")]: [
          moment().subtract(2, "year").startOf("year"),
          moment().subtract(2, "year").endOf("year"),
        ],
      },
      linkedCalendars: false,
      locale: {
        format: "YYYY-MM-DD",
      },
      startDate: startDate || moment(0),
      endDate: endDate || moment().endOf("year").format("YYYY-MM-DD"),
    },
    function (start, end, label) {
      $(".loading-spinner").addClass("active");
      get_users_activity(start.unix(),end.unix(), label);
    }
  );
}

})();

