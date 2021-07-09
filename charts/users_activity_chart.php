<?php
if ( !defined( 'ABSPATH' ) ) { exit; } // Exit if accessed directly.

/**
 * @todo replace all occurrences of the string "template" with a string of your choice
 * @todo also rename in charts-loader.php
 */

class disciple_tools_user_activity_report_Chart_Template extends DT_Metrics_Chart_Base
{
    public $base_slug = 'user-activity-report-metrics'; // lowercase
    public $base_title = "User Activity Report";

    public $title = 'Users Activity';
    public $slug = 'usersactivity'; // lowercase
    public $js_object_name = 'users_activity'; // This object will be loaded into the metrics.js file by the wp_localize_script.
    public $js_file_name = 'users_activity_chart.js'; // should be full file name plus extension
    public $permissions = [ 'dt_all_access_contacts', 'view_project_metrics' ];

    public function __construct() {
        parent::__construct();

        add_action( 'rest_api_init', [ $this, 'add_api_routes' ] );

        if ( !$this->has_permission() ){
            return;
        }
        $url_path = dt_get_url_path();

        // only load scripts if exact url
        if ( "metrics/$this->base_slug/$this->slug" === $url_path ) {

            add_action( 'wp_enqueue_scripts', [ $this, 'scripts' ], 99 );
        }
    }


    /**
     * Load scripts for the plugin
     */
    public function scripts() {
        $post_settings = DT_Posts::get_post_settings( 'contacts' );
        wp_register_script( 'amcharts-core', 'https://www.amcharts.com/lib/4/core.js', false, '4' );
        wp_register_script( 'amcharts-charts', 'https://www.amcharts.com/lib/4/charts.js', false, '4' );

        wp_enqueue_script( 'dt_'.$this->slug.'_script', trailingslashit( plugin_dir_url( __FILE__ ) ) . $this->js_file_name, [
            'jquery',
            'amcharts-core',
            'amcharts-charts'
        ], filemtime( plugin_dir_path( __FILE__ ) .$this->js_file_name ), true );

        // Localize script with array data
        wp_localize_script(
            'dt_'.$this->slug.'_script', $this->js_object_name, [
                'rest_endpoints_base' => esc_url_raw( rest_url() ) . "$this->base_slug/$this->slug",
                'base_slug' => $this->base_slug,
                'slug' => $this->slug,
                'root' => esc_url_raw( rest_url() ),
                'plugin_uri' => plugin_dir_url( __DIR__ ),
                'nonce' => wp_create_nonce( 'wp_rest' ),
                'current_user_login' => wp_get_current_user()->user_login,
                'current_user_id' => get_current_user_id(),
                'stats' => [
                    // add preload stats data into arrays here
                ],
                'translations' => [
                    "title" => $this->title,
                    "User Activity API Call" => __( "User Activity API Call" )
                ],
                'post_type_settings' => $post_settings
            ]
        );
    }

    public function add_api_routes() {
        $namespace = "$this->base_slug/$this->slug";
        register_rest_route(
            $namespace, '/user_activity', [
                'methods'  => 'POST',
                'callback' => [ $this, 'user_activity' ],
                'permission_callback' => function( WP_REST_Request $request ) {
                    return $this->has_permission();
                },
            ]
        );
    }

    public function user_activity( WP_REST_Request $request ) {
        global $wpdb;
        $params = $request->get_params();
        if ( isset( $params['startDate'] ) ) {
            $startTime = 'AND hist_time >= '. $params['startDate'];
        } else {
            $startTime = '';
        }
        if ( isset( $params['endDate'] ) ) {
            $endTime = 'AND hist_time <= '. $params['endDate'];
        } else {
            $endTime = '';
        }
        $user = wp_get_current_user();
        if ( in_array( 'administrator', (array) $user->roles ) || in_array( 'dt_admin', (array) $user->roles ) || in_array( 'strategist', (array) $user->roles ) || in_array( 'user_manager', (array) $user->roles ) ) {
            $userids = get_users( array( 'fields' => array( 'ID', 'display_name' ) ) );
        } else {
            $userids = array( (object) [
                'ID' => $user->ID,
                'display_name' => $user->display_name,
            ]
            );
        }

        $all_user_activity = array();

        foreach ($userids as $userid) {
            $user_activity = $wpdb->get_results( $wpdb->prepare( "
            SELECT user_id, hist_time, meta_id, meta_key, meta_value
            FROM $wpdb->dt_activity_log
            WHERE user_id = %s
            $startTime
            $endTime
            AND meta_key LIKE '%quick_button%'
            ", $userid->ID, $startTime, $endTime), ARRAY_A );

            $all_user_activity[ $userid->display_name ] = array();

            foreach($user_activity as $action) {
                $quick_action_key = $action["meta_key"];

                $quick_action_total = isset($all_user_activity[ $userid->display_name ][$quick_action_key]) && !empty($all_user_activity[ $userid->display_name ][$quick_action_key]) ? $all_user_activity[ $userid->display_name ][$quick_action_key] : 0;

                $quick_action_total++;

                $all_user_activity[ $userid->display_name ][$quick_action_key] = $quick_action_total;

            }

        }
        return $all_user_activity;
    }

}
