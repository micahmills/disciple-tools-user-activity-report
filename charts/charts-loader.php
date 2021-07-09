<?php
if ( !defined( 'ABSPATH' ) ) { exit; } // Exit if accessed directly.

class disciple_tools_user_activity_report_Charts
{
    private static $_instance = null;
    public static function instance(){
        if ( is_null( self::$_instance ) ) {
            self::$_instance = new self();
        }
        return self::$_instance;
    } // End instance()

    public function __construct(){

        require_once( 'users_activity_chart.php' );
        new disciple_tools_user_activity_report_Chart_Template();

        /**
         * @todo add other charts like the pattern above here
         */

    } // End __construct
}
disciple_tools_user_activity_report_Charts::instance();
